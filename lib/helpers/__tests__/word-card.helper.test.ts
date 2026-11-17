import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/helpers/progress-sync.helper", () => ({
  queueProgress: vi.fn(),
}));

const { allLevelData, resolveItemKey } =
  await import("@/lib/helpers/derived.helper");
const { today } = await import("@/lib/helpers/storage.helper");
const { useProgressStore } = await import("@/stores/useProgressStore");
const { saveToReview } = await import("../word-card.helper");

const base = {
  example: "Rina bought a chicken.",
  source: "Bacaan: Market day",
  level: "pre",
  week: 4,
};
const all = () => allLevelData(useProgressStore.getState().custom);

beforeEach(() => {
  const P = useProgressStore.getState();
  P.setKnown(() => ({}));
  P.setSrs(() => ({}));
  P.setCustom(() => []);
});

describe("saveToReview", () => {
  it("marks a Kosakata word memorised, due tomorrow, and never un-marks it", () => {
    const r = saveToReview(
      { ...base, en: "chicken", meaningId: "ayam" },
      all(),
    );
    expect(r).toMatchObject({ status: "scheduled", created: false });
    const s = useProgressStore.getState();
    expect(s.known[r.key]).toBe(1);
    expect(s.srs[r.key]).toEqual({ st: 0, due: today() + 1 });
    expect(s.custom).toEqual([]);

    const again = saveToReview(
      { ...base, en: "chicken", meaningId: "ayam" },
      all(),
    );
    expect(again).toMatchObject({ status: "already", key: r.key });
    expect(useProgressStore.getState().known[r.key]).toBe(1);
  });

  it("uses the given key as is", () => {
    const r = saveToReview(
      { ...base, en: "x", meaningId: "x", key: "2:w:chicken" },
      all(),
    );
    expect(r.key).toBe("2:w:chicken");
    expect(useProgressStore.getState().known["2:w:chicken"]).toBe(1);
  });

  it("turns any other word into a private card in the text's level and week", () => {
    const r = saveToReview(
      {
        ...base,
        level: "inter",
        en: "haggle",
        meaningId: "menawar",
        pron: "HAG-el",
      },
      all(),
    );
    expect(r).toMatchObject({ status: "scheduled", created: true });
    expect(r.key).toBe("inter|4:w:haggle");
    const s = useProgressStore.getState();
    expect(s.custom).toEqual([
      expect.objectContaining({
        level: "inter",
        week: 4,
        en: "haggle",
        id: "menawar",
        pron: "HAG-el",
        ex: base.example,
        personal: true,
        source: "Bacaan: Market day",
      }),
    ]);
    expect(s.srs[r.key]).toEqual({ st: 0, due: today() + 1 });
    // Ulang can find the card.
    expect(resolveItemKey(all(), r.key)?.it[1]).toBe("haggle");

    // Saving it again finds the card, no duplicate.
    const again = saveToReview(
      { ...base, level: "inter", en: "haggle", meaningId: "menawar" },
      all(),
    );
    expect(again.status).toBe("already");
    expect(useProgressStore.getState().custom).toHaveLength(1);
  });
});

describe("markKnown", () => {
  it("does not touch a word that is already memorised", () => {
    const P = useProgressStore.getState();
    P.setKnown(() => ({ "2:w:chicken": 1 }));
    P.setSrs(() => ({ "2:w:chicken": { st: 3, due: 99 } }));
    expect(P.markKnown("2:w:chicken")).toBe(false);
    expect(useProgressStore.getState().srs["2:w:chicken"]).toEqual({
      st: 3,
      due: 99,
    });
  });
});
