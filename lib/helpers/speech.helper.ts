import { toast } from "@/lib/toast";
import {
  generate,
  kokoroSay,
  releaseAudio,
  stopKokoro,
} from "@/lib/tts/kokoro";
import { useTtsStore } from "@/stores/useTtsStore";

// Reads English aloud with Kokoro (an AI voice that runs on the device, see
// lib/tts). Every speaker button in the app goes through speak()/speakAll().

// What is being read right now, so speaker buttons can show it: "preparing"
// while the model loads or the audio is being made, then "playing".
type Phase = "preparing" | "playing";
let now: { id: object; text: string; phase: Phase } | null = null;
const listeners = new Set<() => void>();
const setNow = (n: typeof now) => {
  now = n;
  listeners.forEach((l) => l());
};

export const subscribeSpeaking = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const speakingText = () => (now?.phase === "playing" ? now.text : null);
export const preparingText = () =>
  now?.phase === "preparing" ? now.text : null;

// One message per failure burst, not one per tap.
let lastError = 0;
const reportError = () => {
  if (Date.now() - lastError < 8000) return;
  lastError = Date.now();
  toast.error("Suara gagal dimuat", {
    description: "Periksa koneksi internet, lalu tekan tombol suara lagi.",
  });
};

// Pilot urutan 7: until the AI voice model is ready (not downloaded yet, still
// downloading, or failed), the browser's own voice reads instead, so a
// speaker button is never silent. Not in automated test browsers, which
// have no audio and check window.__spoken instead.
const browserVoiceOk = () =>
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  typeof SpeechSynthesisUtterance !== "undefined" &&
  !(typeof navigator !== "undefined" && navigator.webdriver);

export const usesBrowserVoice = () =>
  browserVoiceOk() && useTtsStore.getState().status !== "ready";

const browserSay = (
  text: string,
  id: object,
  speed?: number,
): Promise<boolean> =>
  new Promise((resolve) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = Math.max(0.5, Math.min(1.5, speed ?? 0.95));
    const voice = synth.getVoices().find((v) => v.lang.startsWith("en"));
    if (voice) u.voice = voice;
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(guard);
      if (now?.id === id && now.text === text) setNow(null);
      resolve(ok);
    };
    // Some browsers never fire "end": don't wait forever.
    const guard = setTimeout(
      () => finish(true),
      2000 + (text.split(/\s+/).length * 700) / u.rate,
    );
    u.onstart = () => {
      if (now?.id === id) setNow({ id, text, phase: "playing" });
    };
    u.onend = () => finish(true);
    u.onerror = () => finish(false);
    setNow({ id, text, phase: "preparing" });
    synth.speak(u);
  });

// e2e tests read what was asked to be spoken (no audio in headless runs).
const record = (text: string) =>
  (window as unknown as { __spoken?: string[] }).__spoken?.push(text);

const say = async (
  text: string,
  id: object,
  speed?: number,
  voice?: string,
): Promise<boolean> => {
  if (usesBrowserVoice()) return browserSay(text, id, speed);
  setNow({ id, text, phase: "preparing" });
  try {
    const finished = await kokoroSay(
      text,
      () => {
        if (now?.id === id) setNow({ id, text, phase: "playing" });
      },
      speed,
      voice,
    );
    return finished;
  } catch {
    reportError();
    return false;
  } finally {
    if (now?.id === id && now.text === text) setNow(null);
  }
};

export interface SpeakOptions {
  /** Overrides the speed chosen in Pilih suara for this line only. */
  speed?: number;
  /** Overrides the voice chosen in Pilih suara (second speaker of a dialogue). */
  voice?: string;
}

export const speak = (text: string, opts?: SpeakOptions) => {
  if (!text.trim()) return;
  record(text);
  void say(text, {}, opts?.speed, opts?.voice);
};

export type SpeakLine = string | ({ text: string } & SpeakOptions);

/**
 * Read lines one after another (a whole dialogue); any other speak() stops
 * it. Resolves true when every line was played to the end.
 */
export const speakAll = async (texts: SpeakLine[]): Promise<boolean> => {
  const lines = texts
    .map((t) => (typeof t === "string" ? { text: t } : t))
    .filter((t) => t.text.trim());
  lines.forEach((l) => record(l.text));
  const id = {};
  for (let i = 0; i < lines.length; i++) {
    // Make the next line while this one plays, so there is no gap. Same
    // voice and speed as it will be played with, or the cache misses.
    const next = lines[i + 1];
    if (next && !usesBrowserVoice())
      generate(next.text, next.voice, next.speed).catch(() => {});
    const l = lines[i];
    const finished = await say(l.text, id, l.speed, l.voice);
    if (!finished) return false;
  }
  return true;
};

export const stopSpeaking = () => {
  stopKokoro();
  if (browserVoiceOk()) window.speechSynthesis.cancel();
  setNow(null);
};

/** Stop speaking and free the audio output for the microphone (Main peran). */
export const releaseSpeech = () => {
  releaseAudio();
  if (browserVoiceOk()) window.speechSynthesis.cancel();
  setNow(null);
};
