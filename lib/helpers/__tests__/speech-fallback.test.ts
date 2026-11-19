import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const kokoroSay = vi.fn(async () => true);
vi.mock("@/lib/tts/kokoro", () => ({
  generate: vi.fn(async () => undefined),
  kokoroSay,
  releaseAudio: vi.fn(),
  stopKokoro: vi.fn(),
}));

const { speak, usesBrowserVoice } = await import("../speech.helper");
const { useTtsStore } = await import("@/stores/useTtsStore");

const spoken: { text: string; rate: number }[] = [];
class Utterance {
  lang = "";
  rate = 1;
  voice: unknown = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

beforeEach(() => {
  spoken.length = 0;
  kokoroSay.mockClear();
  vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
  vi.stubGlobal("speechSynthesis", {
    cancel: vi.fn(),
    getVoices: () => [{ lang: "en-US" }],
    speak: (u: Utterance) => {
      spoken.push({ text: u.text, rate: u.rate });
      u.onend?.();
    },
  });
  Object.defineProperty(navigator, "webdriver", {
    value: false,
    configurable: true,
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("voice fallback (pilot urutan 7)", () => {
  it("uses the browser's voice while the AI voice isn't ready", async () => {
    useTtsStore.setState({ status: "loading" });
    expect(usesBrowserVoice()).toBe(true);
    speak("I work here.", { speed: 0.6 });
    await vi.waitFor(() => expect(spoken).toHaveLength(1));
    expect(spoken[0]).toEqual({ text: "I work here.", rate: 0.6 });
    expect(kokoroSay).not.toHaveBeenCalled();
  });

  it("uses the AI voice once it is ready", async () => {
    useTtsStore.setState({ status: "ready" });
    expect(usesBrowserVoice()).toBe(false);
    speak("I work here.");
    await vi.waitFor(() => expect(kokoroSay).toHaveBeenCalledTimes(1));
    expect(spoken).toHaveLength(0);
  });

  it("never in automated test browsers", () => {
    useTtsStore.setState({ status: "idle" });
    Object.defineProperty(navigator, "webdriver", {
      value: true,
      configurable: true,
    });
    expect(usesBrowserVoice()).toBe(false);
  });
});
