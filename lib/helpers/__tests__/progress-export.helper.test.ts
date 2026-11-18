import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/helpers/progress-sync.helper", () => ({
  queueProgress: vi.fn(),
}));

const { setProgressSnapshot } = await import("@/lib/helpers/storage.helper");
const { applyImport } = await import("../progress-export.helper");
const { useRoleplayStore } = await import("@/stores/useRoleplayStore");
const { useMistakeStore } = await import("@/stores/useMistakeStore");

const session = (id: string) => ({
  id,
  scenarioId: "order",
  level: "beginner",
  week: 1,
  startedAt: "2026-11-16T03:00:00.000Z",
  durationSec: 420,
  userTurns: 5,
  missionComplete: true,
  stepsDone: [0, 1, 2],
  transcript: [{ role: "ai", text: "Hi" }],
  summary: {
    missionComplete: true,
    summary: "Bagus!",
    corrections: [],
    moreNatural: [],
    keyPhrasesUsed: [],
    durationSec: 420,
    userTurns: 5,
    stepsDone: [0, 1, 2],
  },
});

const reset = () => {
  setProgressSnapshot({});
  useRoleplayStore.getState().hydrate();
  useMistakeStore.getState().hydrate();
};

describe("applyImport", () => {
  it("still reads a v3 file (no roleplay data) and leaves roleplay empty", () => {
    reset();
    const msg = applyImport({
      v: 3,
      exportedAt: "2026-10-01T00:00:00Z",
      known: {},
      srs: {},
      own: {},
    });
    expect(msg).toContain("Progres diimpor");
    expect(msg).not.toContain("main peran");
    expect(useRoleplayStore.getState().history).toEqual([]);
    expect(useMistakeStore.getState().items).toEqual([]);
  });

  it("merges v4 roleplay history and mistakes by id", () => {
    reset();
    useRoleplayStore.getState().add(session("a") as never);
    const msg = applyImport({
      v: 4,
      exportedAt: "2026-11-17T00:00:00Z",
      known: {},
      srs: {},
      own: {},
      roleplay: [session("a"), session("b"), { broken: true }],
      mistakes: [
        {
          id: "m1",
          source: "Main peran",
          wrong: "two coffee",
          correct: "two coffees",
          explanation_id: "Jamak pakai -s.",
          category: "kata-tertukar",
          level: "beginner",
          createdAt: "2026-11-16T03:10:00.000Z",
        },
      ],
    });
    expect(
      useRoleplayStore
        .getState()
        .history.map((r) => r.id)
        .sort(),
    ).toEqual(["a", "b"]);
    // Old array → Buku kesalahanku records (ids kept).
    expect(useMistakeStore.getState().items).toEqual([
      expect.objectContaining({
        id: "m1",
        source: "Main peran",
        category: "kata-tertukar",
        status: "active",
        count: 1,
      }),
    ]);
    expect(msg).toContain("2 sesi main peran");
  });
});

describe("Buku kesalahanku in Export/Import", () => {
  it("imports v7 data and merges an old v6 array by pattern", () => {
    reset();
    useMistakeStore.getState().add({
      source: "Grammar",
      wrong: "She go.",
      correct: "She goes.",
      explanation_id: "",
      category: "aturan-dasar",
      level: "pre",
    });
    applyImport({
      v: 6,
      exportedAt: "",
      known: {},
      srs: {},
      own: {},
      mistakes: [
        {
          id: "old",
          source: "Main peran",
          wrong: "she go",
          correct: "She goes!",
          explanation_id: "",
          category: "aturan-dasar",
          level: "pre",
          createdAt: "2026-11-01T00:00:00Z",
        },
      ],
    });
    expect(useMistakeStore.getState().items).toHaveLength(1);
    applyImport({
      v: 7,
      exportedAt: "",
      known: {},
      srs: {},
      own: {},
      mistakes: {
        v: 2,
        items: [
          {
            id: "n",
            key: "x",
            source: "Tanya AI",
            wrong: "I am agree.",
            correct: "I agree.",
            explanation_id: "",
            category: "am-is-are",
            level: "pre",
            createdAt: "2026-11-02T00:00:00Z",
            lastAt: "2026-11-02T00:00:00Z",
            count: 3,
            status: "mastered",
            srs: { st: 4, due: 1, streak: 4, lastGap: 30, reps: 7 },
          },
        ],
        reviewOn: true,
        intro: { day: 0, n: 0 },
      },
    });
    const items = useMistakeStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items.find((m) => m.correct === "I agree.")).toMatchObject({
      count: 3,
      status: "mastered",
    });
  });
});

describe("Progres activity log in Export/Import", () => {
  it("exports v9 with the log and merges it on import; v8 files leave it alone", async () => {
    const { useActivityStore } = await import("@/stores/useActivityStore");
    const { exportProgress } = await import("../progress-export.helper");
    const { today } = await import("@/lib/helpers/storage.helper");
    const T = today();
    reset();
    useActivityStore.getState().hydrate();
    useActivityStore.getState().addTime("vocab", 120);
    let text = "";
    vi.stubGlobal(
      "Blob",
      class {
        constructor(parts: string[]) {
          text = parts[0];
        }
      },
    );
    vi.stubGlobal("URL", { createObjectURL: () => "", revokeObjectURL() {} });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    exportProgress();
    vi.unstubAllGlobals();
    const file = JSON.parse(text) as { v: number; activity: { days: object } };
    expect(file.v).toBe(9);
    expect(file.activity.days).toEqual({ [T]: { m: { vocab: 120 } } });

    applyImport({ v: 8, exportedAt: "", known: {}, srs: {}, own: {} });
    expect(useActivityStore.getState().days[T]).toEqual({ m: { vocab: 120 } });

    applyImport({
      v: 9,
      exportedAt: "",
      known: {},
      srs: {},
      own: {},
      activity: {
        v: 1,
        since: T - 30,
        days: { [T]: { m: { vocab: 60, reading: 90 } }, [T - 3]: { r: 5 } },
        events: [],
      },
    });
    const s = useActivityStore.getState();
    expect(s.since).toBe(T - 30);
    expect(s.days[T]).toEqual({ m: { vocab: 120, reading: 90 } });
    expect(s.days[T - 3]).toEqual({ r: 5 });
  });
});
