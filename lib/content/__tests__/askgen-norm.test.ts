import { describe, expect, it } from "vitest";

import { ASK_GEN } from "@/lib/content";

describe("ASK_GEN.norm", () => {
  it("expands won't and can't correctly (before the general n't rule)", () => {
    const norm = ASK_GEN!.norm;
    expect(norm("I won't go.")).toBe(norm("I will not go"));
    expect(norm("She can't swim")).toBe(norm("She cannot swim"));
    expect(norm("She can't swim")).toBe(norm("she can not swim."));
    expect(norm("They don't know?")).toBe("they do not know");
    expect(norm("I won't go")).not.toContain("wo not");
  });
});

// The fill-to-4 step added "answer with a full stop", which the norm filter
// then removed: e.g. "Has your boss needed more time?" kept 3 options.
describe("ASK_GEN.make", () => {
  it.each(["r1", "r3", "r4"])("gives every %s question 4 options", (rule) => {
    for (const q of ASK_GEN!.make(rule, 200, 7, {}) as { opts: string[] }[])
      expect(q.opts).toHaveLength(4);
  });
});
