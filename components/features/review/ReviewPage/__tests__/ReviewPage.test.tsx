import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// One due word card ("lesson"); data hooks are stubbed, the stores are real.
const KEY = "1:w:lesson";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/hooks/useShellData", () => ({
  useShellData: () => ({
    dueKeys: [KEY],
    dueMistakes: [],
    scheduled: 1,
    doneToday: 0,
    allLevels: { pre: { V: {} } },
    srs: { [KEY]: { st: 1, due: 0 } },
    own: {},
    known: { [KEY]: 1 },
  }),
}));
vi.mock("@/lib/helpers/derived.helper", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  resolveItemKey: () => ({
    lid: "pre",
    w: "1",
    it: ["w", "lesson", "LE-sen", "pelajaran / les", "I have a lesson.", ""],
  }),
}));
vi.mock("@/lib/content", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  hasNote: () => false,
  idOf: () => "",
  noteOf: () => null,
}));
vi.mock("@/lib/hooks/useNotes", () => ({ useNotes: () => false }));
vi.mock("@/lib/hooks/useJumpToWord", () => ({
  useJumpToWord: () => ({ jumpToWord: vi.fn() }),
}));
vi.mock("@/lib/helpers/speech.helper", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  speak: vi.fn(),
}));

const { default: ReviewPage } = await import("../ReviewPage");
const { useProgressStore } = await import("@/stores/useProgressStore");
const { useVocabUiStore } = await import("@/stores/useVocabUiStore");

const bumpSrs = vi.fn();
const typeAnswer = (text: string) => {
  fireEvent.change(screen.getByLabelText(/Ketik kata Inggris/), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cek" }));
};

describe("ReviewPage › word card, Indo → Inggris", () => {
  beforeEach(() => {
    bumpSrs.mockClear();
    useProgressStore.setState({ bumpSrs });
    useVocabUiStore.setState({ flip: true });
  });

  it("asks for the English word instead of Buka jawaban", () => {
    render(<ReviewPage />);
    expect(screen.getByText("pelajaran / les")).toBeTruthy();
    expect(screen.queryByText("lesson")).toBeNull();
    expect(screen.queryByRole("button", { name: /Buka jawaban/ })).toBeNull();
  });

  // Stage 2 of 6 (st 1): Ingat → 7 days, Ragu → 2 days, Lupa → tomorrow.
  it.each([
    ["lesson", "Tepat.", /^Muncul lagi \w+, \d+ \w+/, "good"],
    [
      "leson",
      "Hampir. Kamu menulis leson.",
      /^Muncul lagi \w+, \d+ \w+/,
      "hard",
    ],
    [
      "class",
      "Belum tepat. Kamu menulis class.",
      /^Muncul lagi besok, mulai dari awal$/,
      "forgot",
    ],
  ])(
    'typing "%s" shows "%s" and rates it for the learner',
    (typed, message, comesBack, how) => {
      render(<ReviewPage />);
      typeAnswer(typed);
      expect(screen.getByRole("status").textContent).toBe(message);
      // The answer is shown (word and marked example).
      expect(screen.getAllByText("lesson").length).toBeGreaterThan(0);
      // One Lanjut, saying when the word comes back; no ratings to pick.
      expect(screen.getByText(comesBack)).toBeTruthy();
      expect(screen.queryByRole("button", { name: /Ingat/ })).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
      expect(bumpSrs).toHaveBeenCalledWith(KEY, how);
    },
  );
});

describe("ReviewPage › word card, Inggris → Indo", () => {
  it("keeps Buka jawaban and the three ratings", () => {
    bumpSrs.mockClear();
    useProgressStore.setState({ bumpSrs });
    useVocabUiStore.setState({ flip: false });
    render(<ReviewPage />);
    expect(screen.queryByLabelText(/Ketik kata Inggris/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Buka jawaban/ }));
    fireEvent.click(screen.getByRole("button", { name: /Ingat/ }));
    expect(bumpSrs).toHaveBeenCalledWith(KEY, "good");
  });
});
