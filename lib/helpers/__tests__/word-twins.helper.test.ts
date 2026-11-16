import { describe, expect, it } from "vitest";

import { allLevelData } from "@/lib/helpers/derived.helper";
import { twinIndex, withTwins } from "@/lib/helpers/word-twins.helper";

const twins = twinIndex(allLevelData([]));

describe("word twins", () => {
  it("links the same word with the same meaning across levels", () => {
    expect(twins.get("beginner|5:w:chicken")).toContain("2:w:chicken");
    expect(twins.get("2:w:chicken")).toContain("beginner|5:w:chicken");
  });

  it("fills in twins of memorised words, and only when something is missing", () => {
    const known = { "beginner|5:w:chicken": 1 as const };
    const filled = withTwins(known, twins);
    expect(filled["2:w:chicken"]).toBe(1);
    expect(withTwins(filled, twins)).toBe(filled);
  });
});
