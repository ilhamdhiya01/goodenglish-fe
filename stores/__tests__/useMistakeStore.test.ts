import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/helpers/progress-sync.helper", () => ({
  queueProgress: vi.fn(),
}));

const { queueProgress } = await import("@/lib/helpers/progress-sync.helper");
const { setProgressSnapshot, today } =
  await import("@/lib/helpers/storage.helper");
const { addMistake, useMistakeStore } = await import("../useMistakeStore");
const { useProgressStore } = await import("../useProgressStore");

beforeEach(() => {
  setProgressSnapshot({});
  useMistakeStore.getState().hydrate();
  vi.mocked(queueProgress).mockClear();
});

const m = {
  source: "Kuis Kesalahan umum" as const,
  wrong: "I very like it.",
  correct: "I really like it.",
  explanation_id: "very tidak dipakai sebelum kata kerja.",
  category: "urutan-kata",
  level: "pre" as const,
};

describe("useMistakeStore", () => {
  it("addMistake saves to the server doc without duplicates", () => {
    expect(addMistake(m)).toBe("new");
    expect(addMistake({ ...m, wrong: "i very like it" })).toBe("repeat");
    const s = useMistakeStore.getState();
    expect(s.items).toHaveLength(1);
    expect(s.items[0].count).toBe(2);
    expect(queueProgress).toHaveBeenLastCalledWith(
      "mistakes",
      expect.objectContaining({ v: 2, reviewOn: true }),
    );
  });

  it("writes an old array once in the new shape (so 'tomorrow' stays put)", () => {
    setProgressSnapshot({
      mistakes: [
        {
          id: "x",
          source: "Main peran",
          wrong: "two coffee",
          correct: "two coffees",
          explanation_id: "",
          category: "kata-tertukar",
          level: "pre",
          createdAt: "2026-11-01T00:00:00Z",
        },
      ],
    });
    useMistakeStore.getState().hydrate();
    expect(queueProgress).toHaveBeenCalledWith(
      "mistakes",
      expect.objectContaining({
        v: 2,
        items: [
          expect.objectContaining({
            id: "x",
            srs: expect.objectContaining({ due: today() + 1 }),
          }),
        ],
      }),
    );
  });

  it("grading counts in 'selesai hari ini'; toggle and archive are saved", () => {
    addMistake(m);
    const id = useMistakeStore.getState().items[0].id;
    const before = useProgressStore.getState().doneToday;
    useMistakeStore.getState().grade(id, "good");
    expect(useProgressStore.getState().doneToday).toBe(before + 1);
    expect(useMistakeStore.getState().items[0].srs.reps).toBe(1);

    useMistakeStore.getState().setReviewOn(false);
    useMistakeStore.getState().setStatus(id, "archived");
    expect(useMistakeStore.getState()).toMatchObject({ reviewOn: false });
    expect(useMistakeStore.getState().items[0].status).toBe("archived");
  });
});
