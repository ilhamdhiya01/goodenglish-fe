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
