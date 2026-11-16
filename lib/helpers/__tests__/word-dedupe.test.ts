import { describe, expect, it } from "vitest";

import { flatten, levelData } from "@/lib/helpers/level-data.helper";
import {
  buildSearchIndex,
  groupHits,
  searchVocab,
} from "@/lib/helpers/verb-forms.helper";
import type { CustomWord } from "@/lib/types/vocab.types";

const pool = ["beginner", "pre"].flatMap((lv) =>
  flatten(levelData(lv, []).V).map((x) => ({ ...x, lv })),
);
const search = (q: string, active?: string) =>
  groupHits(searchVocab(buildSearchIndex(pool), q, 120), active);

describe("search results: one row per word", () => {
  it("merges the same word with the same meaning across levels", () => {
    const rows = search("chicken").filter((r) => r.x.it[1] === "chicken");
    expect(rows).toHaveLength(1);
    expect(rows[0].places.map((p) => p.lv)).toEqual(["beginner", "pre"]);
  });

  it("lists the active level first and opens it from the row", () => {
    const [row] = search("chicken", "pre").filter(
      (r) => r.x.it[1] === "chicken",
    );
    expect(row.places[0].lv).toBe("pre");
    expect(row.x).toBe(row.places[0]);
  });

  it("keeps a word with a different meaning on its own row", () => {
    // Pemula: watch = jam tangan (M2) and watch = menonton (M4).
    const rows = search("watch").filter((r) => r.x.it[1] === "watch");
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });
});

describe("levelData: added words never repeat a word already there", () => {
  const word = (en: string, id: string, key: string): CustomWord => ({
    key,
    level: "beginner",
    week: 3,
    type: "w",
    en,
    id,
    pron: "",
    ex: "",
  });
  const items = (custom: CustomWord[]) =>
    flatten(levelData("beginner", custom).V).map((x) => x.it);

  it("hides a shared or Kataku word the level already has", () => {
    const list = items([
      word("Chicken", "ayam", "s:1"),
      word("chicken", "daging ayam", "k:1"),
    ]);
    expect(list.filter((it) => it[1].toLowerCase() === "chicken")).toHaveLength(
      1,
    );
  });

  it("keeps an added word whose meaning is different", () => {
    const list = items([word("chicken", "penakut", "s:2")]);
    expect(list.filter((it) => it[1].toLowerCase() === "chicken")).toHaveLength(
      2,
    );
  });

  it("keeps new words as they are", () => {
    const list = items([word("spatula", "sudip", "s:3")]);
    expect(list.some((it) => it[6] === "s:3")).toBe(true);
  });
});
