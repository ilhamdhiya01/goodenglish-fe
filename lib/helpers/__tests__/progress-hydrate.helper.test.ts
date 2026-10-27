import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/helpers/progress-sync.helper", () => ({
  queueProgress: vi.fn(),
}));

const { applyProgress } = await import("../progress-hydrate.helper");
const { useProgressStore } = await import("@/stores/useProgressStore");

describe("progress-hydrate.helper", () => {
  it("applies the server snapshot only once per page load", () => {
    applyProgress({ srs: { "1:w:go": { st: 1, due: 5 } } });
    expect(useProgressStore.getState().srs).toEqual({
      "1:w:go": { st: 1, due: 5 },
    });

    // Reviewing in the app moves the word forward…
    useProgressStore.getState().setSrs(() => ({ "1:w:go": { st: 2, due: 9 } }));
    // …and remounting AppShell (back from /admin) re-applies the snapshot
    // cached at page load. That must not roll the review back.
    applyProgress({ srs: { "1:w:go": { st: 1, due: 5 } } });

    expect(useProgressStore.getState().srs).toEqual({
      "1:w:go": { st: 2, due: 9 },
    });
  });
});
