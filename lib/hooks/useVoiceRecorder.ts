import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

// Records one spoken answer for Main peran with MediaRecorder and hands the
// file over as-is (webm/opus in Chrome and Firefox, mp4/aac in Safari). The
// backend's self-hosted Whisper writes it down verbatim.

/** At most this long per answer; recording stops by itself. */
export const MAX_RECORD_SEC = 60;

// First one the browser can record wins. Chrome/Android/Firefox: webm/opus;
// Safari (macOS/iOS): mp4.
const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

/** The recording format for this browser ("" = the browser's default). */
export const pickMimeType = (
  isSupported: (t: string) => boolean = (t) =>
    typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t),
): string => MIME_CANDIDATES.find((t) => isSupported(t)) ?? "";

/** File extension the server can tell the format by. */
export const extensionOf = (mime: string) =>
  mime.includes("mp4")
    ? "m4a"
    : mime.includes("ogg")
      ? "ogg"
      : mime.includes("wav")
        ? "wav"
        : "webm";

const noop = () => () => {};

/** True when the page was opened over plain http (not localhost): browsers
 * then hide the microphone entirely, whatever the device. */
export const useInsecurePage = () =>
  useSyncExternalStore(
    noop,
    () => !window.isSecureContext,
    () => false,
  );

/** Whether this page can record (needs HTTPS or localhost, and MediaRecorder). */
export const useRecorderSupported = () =>
  useSyncExternalStore(
    noop,
    () =>
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined",
    () => false,
  );

export interface RecordedClip {
  blob: Blob;
  mimeType: string;
  seconds: number;
}

/**
 * - denied: microphone permission refused
 * - no-mic: no microphone found
 * - no-speech: nothing was recorded
 * - other: anything else (`errorCode` has the browser's name for it)
 */
export type RecorderError = "denied" | "no-mic" | "no-speech" | "other";

interface Live {
  rec: MediaRecorder;
  stream: MediaStream;
  timer: ReturnType<typeof setInterval>;
}

interface Options {
  /** Called with the finished recording. */
  onRecorded: (clip: RecordedClip) => void;
  /** Called right before recording starts (e.g. to silence other audio). */
  onBeforeRecord?: () => void;
}

export const useVoiceRecorder = ({ onRecorded, onBeforeRecord }: Options) => {
  const supported = useRecorderSupported();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<RecorderError | null>(null);
  const [errorCode, setErrorCode] = useState("");
  // Sticky: once the microphone was refused, the page stays in typing mode.
  const [denied, setDenied] = useState(false);
  const live = useRef<Live | null>(null);
  const starting = useRef(false);
  const onRecordedRef = useRef(onRecorded);
  useEffect(() => {
    onRecordedRef.current = onRecorded;
  }, [onRecorded]);

  const fail = useCallback((err: RecorderError, code: string) => {
    console.warn("[mic]", code);
    setError(err);
    setErrorCode(code);
    if (err === "denied") setDenied(true);
  }, []);

  /** Stop recording; the clip is delivered once the recorder has flushed. */
  const stop = useCallback(() => {
    const l = live.current;
    if (!l) return;
    clearInterval(l.timer);
    if (l.rec.state !== "inactive") l.rec.stop();
  }, []);

  const start = useCallback(async () => {
    if (live.current || starting.current) return;
    starting.current = true;
    setError(null);
    setErrorCode("");
    setSeconds(0);
    onBeforeRecord?.();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      starting.current = false;
      const name = err instanceof Error ? err.name : "unknown";
      if (name === "NotAllowedError" || name === "SecurityError")
        return fail("denied", name);
      if (name === "NotFoundError" || name === "OverconstrainedError")
        return fail("no-mic", name);
      return fail("other", name);
    }

    const mime = pickMimeType();
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch (err) {
      starting.current = false;
      stream.getTracks().forEach((t) => t.stop());
      return fail("other", err instanceof Error ? err.name : "recorder");
    }

    const chunks: Blob[] = [];
    const startedAt = Date.now();
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = () => {
      const l = live.current;
      if (l) clearInterval(l.timer);
      live.current = null;
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      const type = rec.mimeType || mime || chunks[0]?.type || "audio/webm";
      const blob = new Blob(chunks, { type });
      if (!blob.size) return fail("no-speech", "empty");
      onRecordedRef.current({
        blob,
        mimeType: type,
        seconds: Math.round((Date.now() - startedAt) / 1000),
      });
    };
    rec.onerror = (e) => {
      const name =
        (e as unknown as { error?: { name?: string } }).error?.name ?? "error";
      fail("other", name);
    };

    const timer = setInterval(() => {
      const sec = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(sec);
      if (sec >= MAX_RECORD_SEC) stop();
    }, 250);
    live.current = { rec, stream, timer };
    // One chunk per second keeps memory flat and, on iOS, makes sure data
    // arrives even if the recorder is stopped abruptly.
    rec.start(1000);
    starting.current = false;
    setRecording(true);
  }, [fail, stop, onBeforeRecord]);

  // Leaving the page while recording must free the microphone.
  useEffect(
    () => () => {
      const l = live.current;
      if (!l) return;
      clearInterval(l.timer);
      l.rec.onstop = null;
      if (l.rec.state !== "inactive") l.rec.stop();
      l.stream.getTracks().forEach((t) => t.stop());
      live.current = null;
    },
    [],
  );

  return {
    supported,
    recording,
    seconds,
    error,
    errorCode,
    denied,
    clearError: useCallback(() => setError(null), []),
    start,
    stop,
  };
};
