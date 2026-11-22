import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MistakeRecord } from "@/lib/types/mistake.types";

vi.mock("@/lib/helpers/speech.helper", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  speak: vi.fn(),
  releaseSpeech: vi.fn(),
}));

const { default: MistakeReviewCard, markWrong } =
  await import("../MistakeReviewCard");
const { usePracticeSessionStore } =
  await import("@/stores/usePracticeSessionStore");

const mistake = (o: Partial<MistakeRecord> = {}): MistakeRecord => ({
  id: "m1",
  key: "k",
  source: "Tanya AI",
  wrong: "She go to school.",
  correct: "She goes to school.",
  explanation_id: "He/she/it pakai -s.",
  category: "tense",
  rule: "tense/he-she-it-s",
  level: "pre",
  createdAt: "2026-11-01T00:00:00.000Z",
  lastAt: "2026-11-01T00:00:00.000Z",
  count: 2,
  status: "active",
  srs: { st: 0, due: 0, streak: 0, lastGap: 0, reps: 0 },
  ...o,
});

// Renders a card whose reveal is wired like ReviewPage's.
const setup = (m: MistakeRecord) => {
  const onGrade = vi.fn();
  const Harness = () => {
    const [revealed, setRevealed] = React.useState(false);
    return (
      <MistakeReviewCard
        m={m}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onGrade={onGrade}
        comesBack={(how) => `kembali: ${how}`}
      />
    );
  };
  const { unmount } = render(<Harness />);
  return { onGrade, unmount };
};
const answer = (label: RegExp, text: string) => {
  fireEvent.change(screen.getByLabelText(label), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Cek" }));
};

import React from "react";

describe("markWrong", () => {
  it("marks the words that differ from the right sentence", () => {
    const parts = markWrong("She go to school.", "She goes to school.");
    expect(parts.filter((p) => p.bad).map((p) => p.t)).toEqual(["go"]);
  });
});

describe("MistakeReviewCard › Betulkan kalimat", () => {
  it("shows the wrong word marked and the topic of the rule", () => {
    setup(mistake());
    expect(
      screen.getByText("Kalimat ini salah di bagian yang ditandai"),
    ).toBeTruthy();
    expect(screen.getByText("Kapan pakai tense apa")).toBeTruthy();
  });

  it.each([
    ["She goes to school", "Tepat.", "good"],
    ["She gose to school", "Hampir. Kamu menulis", "hard"],
    ["She is going to school", "Belum tepat. Kamu menulis", "forgot"],
  ])('"%s" → %s, rated %s', (typed, message, how) => {
    const { onGrade } = setup(mistake());
    answer(/versi yang benar/, typed);
    expect(screen.getByRole("status").textContent).toContain(message);
    expect(screen.getByText(`kembali: ${how}`)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    expect(onGrade).toHaveBeenCalledWith(how);
  });

  // The answer was seen: leaving before Lanjut must not let it be redone.
  it("a checked answer counts even when the page is left before Lanjut", () => {
    const { onGrade, unmount } = setup(mistake());
    answer(/versi yang benar/, "She is going to school");
    expect(onGrade).not.toHaveBeenCalled();
    unmount();
    expect(onGrade).toHaveBeenCalledTimes(1);
    expect(onGrade).toHaveBeenCalledWith("forgot");
  });

  it("…and only once when Lanjut was pressed", () => {
    const { onGrade, unmount } = setup(mistake());
    answer(/versi yang benar/, "She goes to school");
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    unmount();
    expect(onGrade).toHaveBeenCalledTimes(1);
  });

  it("Lihat aturannya opens the exact rule over the card", () => {
    setup(mistake());
    fireEvent.click(screen.getByRole("button", { name: "Lihat aturannya" }));
    const sheet = screen.getByRole("dialog", { name: "Kapan pakai tense apa" });
    expect(sheet.textContent).toContain("V1 + -s / -es");
    // Only that rule, not the rest of the section.
    expect(sheet.textContent).not.toContain("I wish");
    fireEvent.click(screen.getByRole("button", { name: "Kembali ke kartu" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a grammar practice mistake shows its set, and links to that set", () => {
    setup(
      mistake({
        source: "Grammar",
        category: "kata-tertukar",
        rule: undefined,
        wrong: "We stayed home because of it was raining.",
        correct: "We stayed home because it was raining.",
        refId: "conj1:We stayed home because it was raining.",
      }),
    );
    expect(
      screen.getByText("Kata sambung · Because / because of / so"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Lihat aturannya" }));
    const sheet = screen.getByRole("dialog", { name: "Kata sambung" });
    expect(sheet.textContent).toContain("Because / because of / so");
    expect(sheet.textContent).toContain("because of + kata benda");
    const link = screen.getByRole("link", { name: /Buka latihannya/ });
    expect(link.getAttribute("href")).toBe("/grammar/conj");
    fireEvent.click(link);
    expect(usePracticeSessionStore.getState().sets.conj).toBe("conj1");
  });

  it("without a rule id, shows the category's whole section", () => {
    setup(mistake({ rule: undefined, category: "aturan-dasar" }));
    fireEvent.click(screen.getByRole("button", { name: "Lihat aturannya" }));
    const sheet = screen.getByRole("dialog", { name: "Lima aturan dasar" });
    expect(sheet.textContent).toContain("wajib pakai be");
    expect(sheet.textContent).toContain("V2 selalu berdiri sendiri");
  });
});

describe("MistakeReviewCard › Dengar & tulis", () => {
  const dikte = () =>
    mistake({
      source: "Dikte",
      category: "menyimak",
      rule: undefined,
      wrong: "sounds nice oh looks like everyone here",
      correct: "Sounds nice. Oh, looks like everyone's here.",
    });

  it("doesn't show the sentence before answering", () => {
    setup(dikte());
    expect(screen.queryByText(/everyone's here/)).toBeNull();
    expect(
      screen.getByText(/Kesalahan · Menyimak · dari Dikte, 2 kali/),
    ).toBeTruthy();
  });

  it.each([
    ["Sounds nice. Oh, looks like everyone's here.", "Tepat", "good"],
    ["sound nice oh looks like everyone's here", "Hampir", "hard"],
    ["sounds bad", "Belum tepat", "forgot"],
  ])('"%s" → %s, rated %s', (typed, message, how) => {
    const { onGrade } = setup(dikte());
    answer(/Tulis yang kamu dengar/, typed);
    expect(screen.getByRole("status").textContent).toContain(message);
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
    expect(onGrade).toHaveBeenCalledWith(how);
  });
});
