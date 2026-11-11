import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/helpers/progress-sync.helper", () => ({
  queueProgress: vi.fn(),
}));

const { useProgressStore } = await import("../useProgressStore");

describe("bumpSrs", () => {
  it("counts each 'Lupa' so Tanya AI can suggest the most-forgotten words", () => {
    const { setSrs, bumpSrs } = useProgressStore.getState();
    setSrs(() => ({ "3:w:raise": { st: 2, due: 0 } }));

    bumpSrs("3:w:raise", "forgot");
    bumpSrs("3:w:raise", "good");
    bumpSrs("3:w:raise", "forgot");

    const entry = useProgressStore.getState().srs["3:w:raise"];
    expect(entry.lapses).toBe(2);
    expect(entry.st).toBe(0);
  });

  it("adds no field to words that were never forgotten", () => {
    const { setSrs, bumpSrs } = useProgressStore.getState();
    setSrs(() => ({ "3:w:rise": { st: 0, due: 0 } }));
    bumpSrs("3:w:rise", "good");
    expect(useProgressStore.getState().srs["3:w:rise"]).not.toHaveProperty(
      "lapses",
    );
  });
});
