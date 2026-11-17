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
    expect(useMistakeStore.getState().mistakes).toEqual([]);
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
    expect(useMistakeStore.getState().mistakes.map((m) => m.id)).toEqual([
      "m1",
    ]);
    expect(msg).toContain("2 sesi main peran");
  });
});
