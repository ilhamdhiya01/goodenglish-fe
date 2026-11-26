import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MistakeRecord } from "@/lib/types/mistake.types";

vi.mock("@/lib/helpers/speech.helper", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  speak: vi.fn(),
}));

const { default: MyMistakes } = await import("../MyMistakes");
const { useMistakeStore } = await import("@/stores/useMistakeStore");
const { useConfirmStore } = await import("@/stores/useConfirmStore");

const mistake = (o: Partial<MistakeRecord>): MistakeRecord => ({
  id: "m1",
  key: "k1",
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
  ...o,
});

// "Pelajari aturannya" in Punyaku opens the same sheet as Ulang's
// "Lihat aturannya", so one mistake always points at the same rule.
describe("MyMistakes › Pelajari aturannya", () => {
  beforeEach(() => useMistakeStore.setState({ items: [] }));

  it("opens the exact rule of a mistake that has one", () => {
    useMistakeStore.setState({
      items: [mistake({ rule: "tense/he-she-it-s" })],
    });
    render(<MyMistakes />);
    fireEvent.click(screen.getByRole("button", { name: "Pelajari aturannya" }));
    const sheet = screen.getByRole("dialog", { name: "Kapan pakai tense apa" });
    expect(sheet.textContent).toContain("V1 + -s / -es");
    expect(sheet.textContent).not.toContain("I wish");
    fireEvent.click(screen.getByRole("button", { name: "Kembali ke kartu" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the practice set of a Panduan grammar mistake", () => {
    useMistakeStore.setState({
      items: [
        mistake({
          source: "Grammar",
          category: "kata-tertukar",
          wrong: "We stayed home because of it was raining.",
          correct: "We stayed home because it was raining.",
          refId: "conj1:We stayed home because it was raining.",
        }),
      ],
    });
    render(<MyMistakes />);
    fireEvent.click(screen.getByRole("button", { name: "Pelajari aturannya" }));
    const sheet = screen.getByRole("dialog", { name: "Kata sambung" });
    expect(sheet.textContent).toContain("Because / because of / so");
    expect(
      screen
        .getByRole("link", { name: /Buka latihannya/ })
        .getAttribute("href"),
    ).toBe("/grammar/conj");
  });
});

describe("MyMistakes › Hapus", () => {
  beforeEach(() => useMistakeStore.setState({ items: [mistake({})] }));

  it("asks first, then deletes the card", async () => {
    render(<MyMistakes />);
    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(useConfirmStore.getState().request?.title).toBe(
      "Hapus dari Buku kesalahanku?",
    );
    await act(async () => useConfirmStore.getState().settle(true));
    expect(useMistakeStore.getState().items).toEqual([]);
    expect(screen.queryByText("She go to school.")).toBeNull();
  });

  it("keeps the card when cancelled", async () => {
    render(<MyMistakes />);
    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await act(async () => useConfirmStore.getState().settle(false));
    expect(useMistakeStore.getState().items).toHaveLength(1);
  });
});
