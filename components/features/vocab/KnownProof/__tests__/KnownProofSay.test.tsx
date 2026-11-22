import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RecordedClip } from "@/lib/hooks/useVoiceRecorder";

// The microphone and Whisper are faked: the test hands the recorder's clip
// over itself and decides what the server "heard".
const h = vi.hoisted(() => ({
  onRecorded: null as null | ((c: RecordedClip) => void),
  start: vi.fn(),
  stop: vi.fn(),
  transcribe: vi.fn(),
}));
vi.mock("@/lib/hooks/useVoiceRecorder", () => ({
  extensionOf: () => "webm",
  useVoiceRecorder: ({
    onRecorded,
  }: {
    onRecorded: (c: RecordedClip) => void;
  }) => {
    h.onRecorded = onRecorded;
    return {
      supported: true,
      recording: false,
      seconds: 0,
      error: null,
      errorCode: "",
      denied: false,
      clearError: () => {},
      start: h.start,
      stop: h.stop,
    };
  },
}));
vi.mock("@/services/stt.service", () => ({ transcribeAudio: h.transcribe }));
vi.mock("@/lib/helpers/speech.helper", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  speak: vi.fn(),
  releaseSpeech: vi.fn(),
}));

const { default: KnownProof, heardRight } = await import("../KnownProof");
const { useAccessStore } = await import("@/stores/useAccessStore");

const thanks = {
  en: "Thanks a lot.",
  id: "Makasih banyak.",
  type: "ex",
  ex: "Thanks a lot for your help.",
  target: [0, 12] as [number, number],
};
const clip = { blob: new Blob(["x"]), mimeType: "audio/webm", seconds: 2 };

const setup = () => {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  render(<KnownProof {...thanks} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
};
// Types into the field and presses Cek.
const typeAnswer = (text: string) => {
  fireEvent.change(screen.getByLabelText(/Ketik ungkapan Inggris/), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cek" }));
};
// Delivers the recording and lets the transcription settle.
const record = async () => {
  fireEvent.click(screen.getByRole("button", { name: /Rekam/ }));
  expect(h.start).toHaveBeenCalled();
  expect(screen.getByRole("status").textContent).toContain(
    "Menyiapkan mikrofon",
  );
  await act(async () => h.onRecorded?.(clip));
};

describe("heardRight", () => {
  it("needs the expression's words, ignoring case and punctuation; extra words are fine", () => {
    expect(heardRight("Thanks a lot.", "thanks a lot")).toBe(true);
    expect(heardRight("Thanks a lot.", "Thanks a lot for that")).toBe(true);
    expect(heardRight("Thanks a lot.", "thanks")).toBe(false);
    expect(heardRight("Thanks a lot.", "")).toBe(false);
  });

  it("forgives homophones and one-letter slips in longer words", () => {
    expect(heardRight("See you there.", "see you their")).toBe(true);
    expect(heardRight("Just a minute.", "just a minutes")).toBe(true);
    // Short words stay exact: "lot" is not "lots".
    expect(heardRight("Thanks a lot.", "thanks a lots")).toBe(false);
  });

  it("needs every word, so a wrong key word fails a long expression too", () => {
    const en = "Yesterday I worked on the checkout page.";
    expect(heardRight(en, "yesterday I worked on the checkout page")).toBe(
      true,
    );
    expect(heardRight(en, "yesterday I work on the checkout page")).toBe(false);
    expect(heardRight(en, "yesterday I worked on checkout page")).toBe(false);
  });
});

describe("KnownProof › say with the microphone", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    h.start.mockClear();
    h.transcribe.mockReset();
    localStorage.clear();
    useAccessStore.setState({
      session: { menus: ["vocab", "review"] },
    } as never);
  });
  afterEach(() => {
    vi.useRealTimers();
    useAccessStore.setState({ session: null } as never);
  });

  it("marks known when Whisper hears the expression", async () => {
    h.transcribe.mockResolvedValue({ data: { text: "Thanks a lot." } });
    const { onDone } = setup();
    expect(screen.queryByText("Thanks a lot.")).toBeNull();

    await record();
    // The expected phrase goes along as a hint for Whisper.
    expect(h.transcribe).toHaveBeenCalledWith(
      clip.blob,
      "say.webm",
      "en",
      "Thanks a lot.",
    );
    expect(screen.getByRole("status").textContent).toContain("✓ Tepat!");
    act(() => vi.advanceTimersByTime(1500));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("shows what was heard and the answer when it doesn't match", async () => {
    h.transcribe.mockResolvedValue({ data: { text: "thanks" } });
    const { onDone } = setup();
    await record();

    expect(screen.getByText(/Belum cocok/)).toBeTruthy();
    expect(screen.getByText("Thanks a lot.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Rekam lagi/ })).toBeTruthy();
    act(() => vi.advanceTimersByTime(3000));
    expect(onDone).not.toHaveBeenCalled();
  });

  it("offers typing when the server fails", async () => {
    h.transcribe.mockRejectedValue(new Error("stt_busy"));
    const { onDone } = setup();
    await record();

    fireEvent.click(screen.getByRole("button", { name: "Ketik saja" }));
    typeAnswer("thanks a lot");
    act(() => vi.advanceTimersByTime(1500));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("marks a wrong typed answer and shows the expression", () => {
    localStorage.setItem("ge-proof-input", "type");
    const { onDone } = setup();
    typeAnswer("thank you");
    expect(screen.getByRole("status").textContent).toMatch(
      /Jawabannya Thanks a lot\. Coba lagi/,
    );
    act(() => vi.advanceTimersByTime(3000));
    expect(onDone).not.toHaveBeenCalled();
  });

  it('remembers "Ketik saja" for the next cards', () => {
    const first = setup();
    fireEvent.click(screen.getByRole("button", { name: "Ketik saja" }));
    cleanup();
    setup();
    expect(screen.getByLabelText(/Ketik ungkapan Inggris/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pakai suara" })).toBeTruthy();
    expect(first.onDone).not.toHaveBeenCalled();
  });

  it("only types when the token can't use speech-to-text", () => {
    useAccessStore.setState({ session: { menus: ["vocab"] } } as never);
    setup();
    expect(screen.queryByRole("button", { name: /Rekam/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Pakai suara" })).toBeNull();
    expect(screen.getByLabelText(/Ketik ungkapan Inggris/)).toBeTruthy();
  });
});
