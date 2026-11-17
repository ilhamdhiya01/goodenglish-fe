import { describe, expect, it } from "vitest";

import { baseForms } from "../lemma.helper";

describe("baseForms", () => {
  it.each([
    ["went", "go"],
    ["books", "book"],
    ["studies", "study"],
    ["studied", "study"],
    ["making", "make"],
    ["stopped", "stop"],
    ["running", "run"],
    ["watches", "watch"],
    ["was", "be"],
    ["bought", "buy"],
    ["Rina's", "rina"],
  ])("%s → %s", (word, base) => {
    expect(baseForms(word)).toContain(base);
  });

  it("puts the word itself first and ignores punctuation", () => {
    expect(baseForms("Commute,")[0]).toBe("commute");
    expect(baseForms("")).toEqual([]);
  });
});
