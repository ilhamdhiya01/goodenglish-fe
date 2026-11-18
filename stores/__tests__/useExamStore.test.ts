import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/helpers/progress-sync.helper", () => ({
  queueProgress: vi.fn(),
}));

const { queueProgress } = await import("@/lib/helpers/progress-sync.helper");
const { setProgressSnapshot } = await import("@/lib/helpers/storage.helper");
const { applyImport } = await import("@/lib/helpers/progress-export.helper");
const { useExamStore } = await import("../useExamStore");

beforeEach(() => {
  setProgressSnapshot({});
  useExamStore.getState().hydrate();
  vi.mocked(queueProgress).mockClear();
});

describe("useExamStore", () => {
  it("saves placement, attempts and the start level to the server doc", () => {
    const s = useExamStore.getState();
    s.setPlacement({ status: "skipped", date: "2026-11-18T00:00:00.000Z" });
    const a = s.addAttempt({
      level: "pre",
      sections: {},
      pct: 80,
      passed: true,
    });
    s.setBase("pre");
    s.setBase("inter"); // only the first time
    expect(useExamStore.getState()).toMatchObject({
      placement: { status: "skipped" },
      attempts: [a],
      base: "pre",
    });
    expect(queueProgress).toHaveBeenLastCalledWith(
      "exam",
      expect.objectContaining({ base: "pre" }),
    );
  });

  it("imports the exam doc from a v8 file and ignores older files", () => {
    applyImport({ v: 7, exportedAt: "", known: {}, srs: {}, own: {} });
    expect(useExamStore.getState().attempts).toEqual([]);
    applyImport({
      v: 8,
      exportedAt: "",
      known: {},
      srs: {},
      own: {},
      exam: {
        placement: null,
        attempts: [
          {
            id: "x",
            level: "beginner",
            date: "2026-11-10T00:00:00.000Z",
            sections: { vocab: { right: 10, total: 10 } },
            pct: 100,
            passed: true,
          },
        ],
        base: "beginner",
      },
    });
    expect(useExamStore.getState().attempts.map((a) => a.id)).toEqual(["x"]);
  });
});
