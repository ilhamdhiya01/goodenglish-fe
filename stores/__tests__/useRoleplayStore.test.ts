import { describe, expect, it, vi } from "vitest";

import type { RoleplayRecord } from "@/lib/types/roleplay.types";

vi.mock("@/lib/helpers/progress-sync.helper", () => ({
  queueProgress: vi.fn(),
}));

const { queueProgress } = await import("@/lib/helpers/progress-sync.helper");
const { setProgressSnapshot } = await import("@/lib/helpers/storage.helper");
const {
  mergeRoleplay,
  roleplaySeconds,
  ROLEPLAY_HISTORY_MAX,
  useRoleplayStore,
} = await import("../useRoleplayStore");
const { mergeMistakes, useMistakeStore } = await import("../useMistakeStore");

const rec = (o: Partial<RoleplayRecord> = {}): RoleplayRecord => ({
  id: "s1",
  scenarioId: "order",
  level: "beginner",
  week: 2,
  startedAt: "2026-11-16T03:00:00.000Z",
  durationSec: 300,
  userTurns: 4,
  missionComplete: true,
  stepsDone: [0, 1, 2],
  transcript: [{ role: "ai", text: "Hi" }],
  summary: {
    missionComplete: true,
    summary: "Bagus!",
    corrections: [],
    moreNatural: [],
    keyPhrasesUsed: [],
    durationSec: 300,
    userTurns: 4,
    stepsDone: [0, 1, 2],
  },
  ...o,
});

describe("useRoleplayStore", () => {
  it("reads the history from the progress snapshot, dropping broken entries", () => {
    setProgressSnapshot({
      roleplay: [rec(), { id: "x" }, null, "junk"],
    });
    useRoleplayStore.getState().hydrate();
    expect(useRoleplayStore.getState().history.map((r) => r.id)).toEqual([
      "s1",
    ]);
  });

  it("starts empty when the learner has no roleplay data yet", () => {
    setProgressSnapshot({});
    useRoleplayStore.getState().hydrate();
    expect(useRoleplayStore.getState().history).toEqual([]);
  });

  it("adds a session newest-first, replaces one with the same id and saves it", () => {
    setProgressSnapshot({});
    useRoleplayStore.getState().hydrate();
    const { add } = useRoleplayStore.getState();
    add(rec({ id: "a", startedAt: "2026-11-15T00:00:00.000Z" }));
    add(rec({ id: "b", startedAt: "2026-11-16T00:00:00.000Z" }));
    add(
      rec({ id: "a", startedAt: "2026-11-15T00:00:00.000Z", durationSec: 9 }),
    );
    const h = useRoleplayStore.getState().history;
    expect(h.map((r) => r.id)).toEqual(["b", "a"]);
    expect(h[1].durationSec).toBe(9);
    expect(queueProgress).toHaveBeenLastCalledWith("roleplay", h);
  });
});

describe("mergeRoleplay", () => {
  it("keeps current sessions, adds new ones by id and caps the list", () => {
    const cur = [rec({ id: "a", durationSec: 1 })];
    const incoming = [
      rec({ id: "a", durationSec: 999 }),
      ...Array.from({ length: ROLEPLAY_HISTORY_MAX + 5 }, (_, i) =>
        rec({
          id: "n" + i,
          startedAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
        }),
      ),
    ];
    const out = mergeRoleplay(cur, incoming);
    expect(out).toHaveLength(ROLEPLAY_HISTORY_MAX);
    expect(out.find((r) => r.id === "a")?.durationSec).toBe(1);
  });

  it("ignores anything that isn't a list", () => {
    expect(mergeRoleplay([rec()], undefined)).toHaveLength(1);
    expect(mergeRoleplay([rec()], { a: 1 })).toHaveLength(1);
  });
});

describe("roleplaySeconds (Rencana checkpoint)", () => {
  it("adds up the sessions of one level and curriculum week only", () => {
    const h = [
      rec({ id: "1", durationSec: 400 }),
      rec({ id: "2", durationSec: 250 }),
      rec({ id: "3", durationSec: 900, week: 3 }),
      rec({ id: "4", durationSec: 900, level: "pre" }),
    ];
    expect(roleplaySeconds(h, "beginner", 2)).toBe(650);
    expect(roleplaySeconds(h, "beginner", 4)).toBe(0);
  });
});

describe("useMistakeStore", () => {
  const m = (id: string, createdAt: string) => ({
    id,
    source: "Main peran" as const,
    wrong: "two coffee",
    correct: "two coffees",
    explanation_id: "Jamak pakai -s.",
    category: "kata-tertukar",
    level: "beginner" as const,
    createdAt,
  });

  it("saves new mistakes first and merges imports by id", () => {
    setProgressSnapshot({});
    useMistakeStore.getState().hydrate();
    useMistakeStore.getState().addMany([m("a", "2026-11-15T00:00:00Z")]);
    useMistakeStore.getState().addMany([m("b", "2026-11-16T00:00:00Z")]);
    expect(useMistakeStore.getState().mistakes.map((x) => x.id)).toEqual([
      "b",
      "a",
    ]);
    expect(queueProgress).toHaveBeenLastCalledWith(
      "mistakes",
      useMistakeStore.getState().mistakes,
    );
    expect(
      mergeMistakes(
        [m("a", "2026-11-15T00:00:00Z")],
        [m("a", "x"), { bad: 1 }],
      ),
    ).toHaveLength(1);
  });
});
