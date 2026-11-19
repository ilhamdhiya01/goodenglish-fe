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

// chicken = ayam: Pemula M5 and Pre-intermediate M2 (bundled data).
describe("the same word in other levels", () => {
  const BEGINNER = "beginner|5:w:chicken";
  const PRE = "2:w:chicken";

  it("is memorised everywhere at once, but reviewed once", () => {
    const { setKnown, setSrs, toggleKnown } = useProgressStore.getState();
    setKnown(() => ({}));
    setSrs(() => ({}));

    toggleKnown(BEGINNER);
    const s = useProgressStore.getState();
    expect(s.known[BEGINNER]).toBe(1);
    expect(s.known[PRE]).toBe(1);
    expect(s.srs[BEGINNER]).toBeDefined();
    expect(s.srs[PRE]).toBeUndefined();

    // Un-memorising from the other level clears both; the review history
    // stays (and comes back with the word).
    const history = { st: 3, due: 99_999 };
    setSrs((x) => ({ ...x, [BEGINNER]: history }));
    toggleKnown(PRE);
    const after = useProgressStore.getState();
    expect(after.known[BEGINNER]).toBeUndefined();
    expect(after.known[PRE]).toBeUndefined();
    expect(after.srs[BEGINNER]).toEqual(history);
    toggleKnown(BEGINNER);
    expect(useProgressStore.getState().srs[BEGINNER]).toEqual(history);
  });

  it("leaves a word with another meaning alone", () => {
    const { setKnown, toggleKnown } = useProgressStore.getState();
    setKnown(() => ({}));
    // Pemula: watch = jam tangan (M2) vs watch = menonton (M4).
    toggleKnown("beginner|2:w:watch");
    expect(useProgressStore.getState().known["beginner|4:w:watch"]).toBe(
      undefined,
    );
  });
});

describe("doneToday", () => {
  it("starts from 0 on a new day even when the tab stayed open", async () => {
    const { vi } = await import("vitest");
    const store = useProgressStore;
    store.setState({ doneToday: 7, doneDay: 1 });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-20T03:00:00Z"));
    store.getState().setDoneToday((n) => n + 1);
    expect(store.getState().doneToday).toBe(1);
    vi.useRealTimers();
  });
});
