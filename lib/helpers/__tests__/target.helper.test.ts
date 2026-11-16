import { describe, expect, it } from "vitest";

import { findTarget } from "../target.helper";

const mark = (s: string, en: string, f = null as never) => {
  const r = findTarget(s, en, f);
  return r ? s.slice(r[0], r[1]) : null;
};

describe("findTarget", () => {
  it("finds the word itself, case-insensitively", () => {
    expect(mark("Actually, I have a meeting at ten.", "actually")).toBe(
      "Actually",
    );
  });

  it("finds V2 / V3 forms of a phrasal verb", () => {
    const f = {
      v2: "ran out of",
      v3: "run out of",
      irregular: true,
      same: false,
      ing: "",
    };
    expect(
      findTarget(
        "We ran out of coffee this morning.",
        "run out of",
        f as never,
      ),
    ).toEqual([3, 13]);
  });

  it("finds a regular ending on the first word", () => {
    expect(mark("She looks forward to the weekend.", "look forward to")).toBe(
      "looks forward to",
    );
    expect(mark("I am making breakfast.", "make")).toBe("making");
  });

  it("matches whole words only", () => {
    expect(mark("The cabinet is open.", "cab")).toBeNull();
  });

  it("returns null when the word is not in the sentence", () => {
    expect(mark("Hello there.", "although")).toBeNull();
  });
});
