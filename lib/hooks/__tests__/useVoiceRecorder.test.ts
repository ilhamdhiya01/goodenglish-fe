import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  extensionOf,
  MAX_RECORD_SEC,
  pickMimeType,
  useVoiceRecorder,
} from "../useVoiceRecorder";

// A MediaRecorder the test drives: it hands over one chunk on stop().
class FakeRecorder {
  static supported = new Set(["audio/webm;codecs=opus"]);
  static isTypeSupported = (t: string) => FakeRecorder.supported.has(t);
  static last: FakeRecorder | null = null;
  state: "inactive" | "recording" = "inactive";
  mimeType: string;
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  payload = new Blob(["abc"], { type: "audio/webm" });
  constructor(_s: unknown, opts?: { mimeType?: string }) {
    this.mimeType = opts?.mimeType ?? "";
    FakeRecorder.last = this;
  }
  start = vi.fn(() => {
    this.state = "recording";
  });
  stop = vi.fn(() => {
    this.state = "inactive";
    this.ondataavailable?.({ data: this.payload });
    this.onstop?.();
  });
}

const stopTrack = vi.fn();
const stream = { getTracks: () => [{ stop: stopTrack }] };
let getUserMedia: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  FakeRecorder.supported = new Set(["audio/webm;codecs=opus"]);
  getUserMedia = vi.fn().mockResolvedValue(stream);
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
  stopTrack.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("pickMimeType / extensionOf", () => {
  it("prefers webm/opus, then mp4 (Safari), then ogg", () => {
    expect(pickMimeType((t) => t === "audio/webm;codecs=opus")).toBe(
      "audio/webm;codecs=opus",
    );
    expect(pickMimeType((t) => t === "audio/mp4")).toBe("audio/mp4");
    expect(pickMimeType((t) => t.startsWith("audio/ogg"))).toBe(
      "audio/ogg;codecs=opus",
    );
    expect(pickMimeType(() => false)).toBe("");
  });

  it("names the file after its format", () => {
    expect(extensionOf("audio/mp4")).toBe("m4a");
    expect(extensionOf("audio/webm;codecs=opus")).toBe("webm");
    expect(extensionOf("audio/ogg;codecs=opus")).toBe("ogg");
  });
});

describe("useVoiceRecorder", () => {
  it("records in the best format and delivers the clip on stop", async () => {
    const onRecorded = vi.fn();
    const before = vi.fn();
    const { result } = renderHook(() =>
      useVoiceRecorder({ onRecorded, onBeforeRecord: before }),
    );
    expect(result.current.supported).toBe(true);
    await act(async () => {
      await result.current.start();
    });
    expect(before).toHaveBeenCalled();
    expect(FakeRecorder.last!.mimeType).toBe("audio/webm;codecs=opus");
    expect(result.current.recording).toBe(true);

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.seconds).toBe(3);
    act(() => result.current.stop());

    expect(result.current.recording).toBe(false);
    expect(stopTrack).toHaveBeenCalled();
    const clip = onRecorded.mock.calls[0][0];
    expect(clip.blob.size).toBe(3);
    expect(clip.mimeType).toBe("audio/webm;codecs=opus");
  });

  it("uses mp4 on Safari", async () => {
    FakeRecorder.supported = new Set(["audio/mp4"]);
    const { result } = renderHook(() =>
      useVoiceRecorder({ onRecorded: vi.fn() }),
    );
    await act(async () => {
      await result.current.start();
    });
    expect(FakeRecorder.last!.mimeType).toBe("audio/mp4");
  });

  it(`stops by itself after ${MAX_RECORD_SEC} seconds`, async () => {
    const onRecorded = vi.fn();
    const { result } = renderHook(() => useVoiceRecorder({ onRecorded }));
    await act(async () => {
      await result.current.start();
    });
    act(() => vi.advanceTimersByTime(MAX_RECORD_SEC * 1000 + 300));
    expect(FakeRecorder.last!.stop).toHaveBeenCalled();
    expect(onRecorded).toHaveBeenCalledTimes(1);
  });

  it("remembers a refused microphone", async () => {
    getUserMedia.mockRejectedValue(
      Object.assign(new Error("no"), { name: "NotAllowedError" }),
    );
    const { result } = renderHook(() =>
      useVoiceRecorder({ onRecorded: vi.fn() }),
    );
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error).toBe("denied");
    expect(result.current.denied).toBe(true);
    expect(result.current.recording).toBe(false);
    act(() => result.current.clearError());
    expect(result.current.denied).toBe(true);
  });

  it("reports a missing microphone and an empty recording", async () => {
    getUserMedia.mockRejectedValueOnce(
      Object.assign(new Error("no"), { name: "NotFoundError" }),
    );
    const onRecorded = vi.fn();
    const { result } = renderHook(() => useVoiceRecorder({ onRecorded }));
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error).toBe("no-mic");

    await act(async () => {
      await result.current.start();
    });
    FakeRecorder.last!.payload = new Blob([]);
    act(() => result.current.stop());
    expect(result.current.error).toBe("no-speech");
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it("is unsupported without MediaRecorder or getUserMedia (plain http)", () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });
    const { result } = renderHook(() =>
      useVoiceRecorder({ onRecorded: vi.fn() }),
    );
    expect(result.current.supported).toBe(false);
  });
});
