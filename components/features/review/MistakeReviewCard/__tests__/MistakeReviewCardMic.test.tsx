import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RecordedClip } from "@/lib/hooks/useVoiceRecorder";
import type { MistakeRecord } from "@/lib/types/mistake.types";

// The microphone and Whisper are faked: the test hands the recorder's clip
// over itself and decides what the server answers.
const h = vi.hoisted(() => ({
  onRecorded: null as null | ((c: RecordedClip) => void),
  start: vi.fn(),
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
      stop: vi.fn(),
    };
  },
}));
vi.mock("@/services/stt.service", () => ({ transcribeAudio: h.transcribe }));
vi.mock("@/lib/helpers/speech.helper", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  speak: vi.fn(),
  releaseSpeech: vi.fn(),
}));

const { default: MistakeReviewCard } = await import("../MistakeReviewCard");

const m: MistakeRecord = {
  id: "m1",
  key: "k",
  source: "Tanya AI",
  wrong: "She go to school.",
  correct: "She goes to school.",
  explanation_id: "He/she/it pakai -s.",
  category: "tense",
  level: "pre",
  createdAt: "2026-11-01T00:00:00.000Z",
  lastAt: "2026-11-01T00:00:00.000Z",
  count: 1,
  status: "active",
  srs: { st: 0, due: 0, streak: 0, lastGap: 0, reps: 0 },
};
const clip = { blob: new Blob(["x"]), mimeType: "audio/webm", seconds: 2 };

const record = async () => {
  render(
    <MistakeReviewCard
      m={m}
      revealed={false}
      onReveal={vi.fn()}
      onGrade={vi.fn()}
      comesBack={() => ""}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Jawab dengan suara" }));
  expect(h.start).toHaveBeenCalled();
  expect(screen.getByText(/Menyiapkan mikrofon/)).toBeTruthy();
  await act(async () => h.onRecorded?.(clip));
};

describe("MistakeReviewCard › answering by voice", () => {
  beforeEach(() => {
    h.start.mockClear();
    h.transcribe.mockReset();
  });

  it("sends the right sentence along and puts what was heard in the box", async () => {
    h.transcribe.mockResolvedValue({ data: { text: "She goes to school." } });
    await record();
    expect(h.transcribe).toHaveBeenCalledWith(
      clip.blob,
      "answer.webm",
      "en",
      "She goes to school.",
    );
    expect(
      (screen.getByLabelText(/versi yang benar/) as HTMLInputElement).value,
    ).toBe("She goes to school.");
  });

  it("says so when the answer was spoken in Indonesian", async () => {
    h.transcribe.mockRejectedValue(new Error("stt_not_english"));
    await record();
    expect(screen.getByText(/bukan bahasa Inggris/)).toBeTruthy();
    expect(
      (screen.getByLabelText(/versi yang benar/) as HTMLInputElement).value,
    ).toBe("");
  });
});
