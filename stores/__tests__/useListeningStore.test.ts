import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/helpers/progress-sync.helper", () => ({
  queueProgress: vi.fn(),
}));

const { queueProgress } = await import("@/lib/helpers/progress-sync.helper");
const { setProgressSnapshot } = await import("@/lib/helpers/storage.helper");
const { applyImport } = await import("@/lib/helpers/progress-export.helper");
const { mergeListening, normalizeListening, unlockedStage, useListeningStore } =
  await import("../useListeningStore");

const set = (o: object = {}) => ({
  tab: "dikte" as const,
  stage: 1,
  score: 8,
  total: 10,
  questions: 10,
  level: "pre",
  week: 2,
  ...o,
});

beforeEach(() => {
  setProgressSnapshot({});
  useListeningStore.getState().hydrate();
});

describe("useListeningStore", () => {
  it("starts empty with stage 1 open, even from old or broken data", () => {
    setProgressSnapshot({ listening: { results: [{ junk: 1 }], stages: "x" } });
    useListeningStore.getState().hydrate();
    const s = useListeningStore.getState();
    expect(s.results).toEqual([]);
    expect(unlockedStage(s, "dikte")).toBe(1);
  });

  it("opens the next stage at 80% on the highest open stage only", () => {
    const { finishSet } = useListeningStore.getState();
    expect(finishSet(set({ score: 7 })).unlocked).toBe(false);
    expect(unlockedStage(useListeningStore.getState(), "dikte")).toBe(1);

    expect(finishSet(set({ score: 8 })).unlocked).toBe(true);
    expect(unlockedStage(useListeningStore.getState(), "dikte")).toBe(2);

    // Passing stage 1 again doesn't skip ahead.
    expect(finishSet(set({ score: 10 })).unlocked).toBe(false);
    expect(unlockedStage(useListeningStore.getState(), "dikte")).toBe(2);

    finishSet(set({ stage: 2, score: 9 }));
    expect(finishSet(set({ stage: 3, score: 10 })).unlocked).toBe(false);
    expect(unlockedStage(useListeningStore.getState(), "dikte")).toBe(3);
    // Other tabs are separate.
    expect(unlockedStage(useListeningStore.getState(), "bunyi")).toBe(1);
  });

  it("keeps every result, newest first, and saves to the server doc", () => {
    const { finishSet } = useListeningStore.getState();
    finishSet(set({ score: 3 }));
    finishSet(set({ tab: "bunyi", score: 18, total: 20 }));
    const s = useListeningStore.getState();
    expect(s.results.map((r) => [r.tab, r.score, r.total])).toEqual([
      ["bunyi", 18, 20],
      ["dikte", 3, 10],
    ]);
    expect(s.results[0]).toMatchObject({ level: "pre", week: 2, stage: 1 });
    expect(queueProgress).toHaveBeenLastCalledWith(
      "listening",
      expect.objectContaining({ results: s.results }),
    );
  });

  it("tracks seen items and pair stats", () => {
    const { markSeen, countPair } = useListeningStore.getState();
    markSeen(["d1", "d2"]);
    countPair("th|think|sink", true);
    countPair("th|think|sink", false);
    const s = useListeningStore.getState();
    expect(s.seen).toEqual({ d1: 1, d2: 1 });
    expect(s.pairs["th|think|sink"]).toEqual({ right: 1, total: 2 });
  });
});

describe("mergeListening and import", () => {
  it("merges results by id, the furthest stage, seen and the busier pair stats", () => {
    const cur = normalizeListening({
      results: [
        {
          id: "a",
          date: "2026-11-01",
          tab: "dikte",
          stage: 1,
          score: 9,
          total: 10,
        },
      ],
      stages: { dikte: 2 },
      seen: { x: 1 },
      pairs: { p: { right: 5, total: 6 } },
    });
    const m = mergeListening(cur, {
      results: [
        {
          id: "a",
          date: "2026-11-01",
          tab: "dikte",
          stage: 1,
          score: 1,
          total: 10,
        },
        {
          id: "b",
          date: "2026-11-02",
          tab: "bunyi",
          stage: 1,
          score: 15,
          total: 20,
        },
      ],
      stages: { dikte: 3, bunyi: 2 },
      seen: { y: 1 },
      pairs: { p: { right: 1, total: 2 }, q: { right: 1, total: 1 } },
    });
    expect(m.results.map((r) => [r.id, r.score])).toEqual([
      ["b", 15],
      ["a", 9],
    ]);
    expect(m.stages).toEqual({ dikte: 3, bunyi: 2 });
    expect(m.seen).toEqual({ x: 1, y: 1 });
    expect(m.pairs).toEqual({
      p: { right: 5, total: 6 },
      q: { right: 1, total: 1 },
    });
  });

  it("imports a v5 file and leaves Menyimak alone for a v4 file", () => {
    applyImport({ v: 4, exportedAt: "", known: {}, srs: {}, own: {} });
    expect(useListeningStore.getState().results).toEqual([]);
    applyImport({
      v: 5,
      exportedAt: "",
      known: {},
      srs: {},
      own: {},
      listening: {
        results: [
          {
            id: "z",
            date: "2026-11-03",
            tab: "dengar",
            stage: 1,
            score: 3,
            total: 3,
          },
        ],
        stages: { dengar: 2 },
      },
    });
    const s = useListeningStore.getState();
    expect(s.results.map((r) => r.id)).toEqual(["z"]);
    expect(unlockedStage(s, "dengar")).toBe(2);
  });
});
