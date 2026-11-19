import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/helpers/progress-sync.helper", () => ({
  queueProgress: vi.fn(),
}));

const { queueProgress } = await import("@/lib/helpers/progress-sync.helper");
const { setProgressSnapshot } = await import("@/lib/helpers/storage.helper");
const { applyImport, exportProgress } =
  await import("@/lib/helpers/progress-export.helper");
const { lookupKey, mergeReading, normalizeReading, useReadingStore } =
  await import("../useReadingStore");

const res = (o: object = {}) => ({
  textId: "t1",
  title: "Monday",
  level: "pre" as const,
  week: 3,
  score: 4,
  total: 5,
  savedWords: 2,
  ...o,
});

beforeEach(() => {
  setProgressSnapshot({});
  useReadingStore.getState().hydrate();
  vi.mocked(queueProgress).mockClear();
});

describe("useReadingStore", () => {
  it("starts empty, even from broken data", () => {
    setProgressSnapshot({
      reading: { results: [{ x: 1 }], done: "x", lookups: { a: 1 } },
    });
    useReadingStore.getState().hydrate();
    const s = useReadingStore.getState();
    expect(s.results).toEqual([]);
    expect(s.done).toEqual({});
    expect(s.lookups).toEqual({});
  });

  it("saves results and marks the text done (first date kept)", () => {
    const { finish } = useReadingStore.getState();
    const a = finish(res());
    finish(res({ score: 5 }));
    const s = useReadingStore.getState();
    expect(s.results.map((r) => r.score)).toEqual([5, 4]);
    expect(s.done).toEqual({ t1: a.date });
    expect(queueProgress).toHaveBeenCalledWith(
      "reading",
      expect.objectContaining({ done: { t1: a.date } }),
    );
  });

  it("caches looked-up meanings per level and word", () => {
    useReadingStore.getState().cacheLookup("pre", "Went", {
      lemma: "go",
      meaningId: "pergi",
      pron: "",
    });
    expect(
      useReadingStore.getState().lookups[lookupKey("pre", "went")],
    ).toEqual({ lemma: "go", meaningId: "pergi", pron: "" });
  });

  it("merges an import: results by id, earliest done date", () => {
    const cur = normalizeReading({
      results: [{ ...res(), id: "a", date: "2026-11-02T00:00:00Z" }],
      done: { t1: "2026-11-02T00:00:00Z" },
    });
    const m = mergeReading(cur, {
      results: [
        { ...res(), id: "a", date: "2026-11-02T00:00:00Z" },
        { ...res({ textId: "t2" }), id: "b", date: "2026-11-05T00:00:00Z" },
      ],
      done: { t1: "2026-11-01T00:00:00Z", t2: "2026-11-05T00:00:00Z" },
    });
    expect(m.results.map((r) => r.id)).toEqual(["b", "a"]);
    expect(m.done).toEqual({
      t1: "2026-11-01T00:00:00Z",
      t2: "2026-11-05T00:00:00Z",
    });
  });
});

describe("Export/Import v6", () => {
  it("imports reading from a v6 file and leaves it alone for a v5 file", () => {
    applyImport({
      v: 5,
      exportedAt: "",
      known: {},
      srs: {},
      own: {},
    });
    expect(useReadingStore.getState().results).toEqual([]);

    applyImport({
      v: 6,
      exportedAt: "",
      known: {},
      srs: {},
      own: {},
      reading: {
        results: [{ ...res(), id: "z", date: "2026-11-10T00:00:00Z" }],
        done: { t1: "2026-11-10T00:00:00Z" },
        lookups: {},
      },
    });
    expect(useReadingStore.getState().done).toEqual({
      t1: "2026-11-10T00:00:00Z",
    });
  });

  it("exports reading (v6+) in the export file", async () => {
    useReadingStore.getState().finish(res());
    let blob: Blob | null = null;
    const url = vi
      .spyOn(URL, "createObjectURL")
      .mockImplementation((b) => ((blob = b as Blob), "blob:x"));
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    exportProgress();
    expect(url).toHaveBeenCalled();
    const d = JSON.parse(await blob!.text()) as {
      v: number;
      reading: { done: object };
    };
    expect(d.v).toBeGreaterThanOrEqual(6);
    expect(Object.keys(d.reading.done)).toEqual(["t1"]);
  });
});

describe("Bacaan selesai", () => {
  it("a text is done only with at least 4 of 5 right", () => {
    useReadingStore.setState({ results: [], done: {}, lookups: {} });
    const { finish } = useReadingStore.getState();
    finish(res({ score: 3 }));
    expect(useReadingStore.getState().done).toEqual({});
    const b = finish(res({ score: 4 }));
    expect(useReadingStore.getState().done).toEqual({ t1: b.date });
    // Every try is still recorded with its score.
    expect(
      useReadingStore
        .getState()
        .results.slice(0, 2)
        .map((r) => r.score),
    ).toEqual([4, 3]);
  });
});

describe("arti kata per kalimat", () => {
  it("the same word in another sentence has its own cache entry", () => {
    expect(lookupKey("pre", "Went", "She went home.")).toBe(
      lookupKey("pre", "went", "  she WENT  home. "),
    );
    expect(lookupKey("pre", "went", "She went home.")).not.toBe(
      lookupKey("pre", "went", "The light went out."),
    );
    expect(lookupKey("pre", "went")).toBe("pre|went");
  });
});
