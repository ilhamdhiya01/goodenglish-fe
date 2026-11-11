import { describe, expect, it } from "vitest";

import type { PlanRow } from "@/lib/types/vocab.types";

import { buildSuggestions } from "../ai-suggestions.helper";

const PLAN: PlanRow = [
  3,
  "Kerja, kantor & meeting",
  "Past Simple",
  "first, then, after that",
];
const RAISE = { en: "raise", meaning: "menaikkan" };
const RISE = { en: "rise", meaning: "naik" };

const base = { week: 3, plan: PLAN, forgotten: [], due: [] };

describe("buildSuggestions", () => {
  it("builds on the active week's topic on Kosakata", () => {
    const s = buildSuggestions({ ...base, page: "vocab" });
    expect(s[0]).toContain('"Kerja, kantor & meeting"');
    expect(s).toHaveLength(2);
  });

  it("uses the week's tense and connectors on Grammar", () => {
    const s = buildSuggestions({ ...base, page: "grammar" });
    expect(s[0]).toBe("Jelaskan Past Simple dengan contoh sehari-hari.");
    expect(s[1]).toBe('Kapan pakai "first" dan kapan "then"?');
  });

  it("adds the most-forgotten word after the page ideas", () => {
    const s = buildSuggestions({
      ...base,
      page: "vocab",
      forgotten: [RAISE, RISE],
    });
    expect(s).toHaveLength(3);
    expect(s[2]).toContain('Aku sering lupa "raise" (menaikkan)');
  });

  it("gives the words the room on Ulang hari ini", () => {
    const s = buildSuggestions({
      ...base,
      page: "review",
      forgotten: [RAISE, RISE],
    });
    expect(s).toEqual([
      expect.stringContaining('"raise"'),
      expect.stringContaining('"rise"'),
    ]);
  });

  it("falls back to due words, then to general ideas", () => {
    const due = buildSuggestions({ ...base, page: "review", due: [RISE] });
    expect(due[0]).toContain('Bantu aku mengingat "rise"');

    const none = buildSuggestions({ ...base, page: "review" });
    expect(none).toHaveLength(2);
    expect(none[0]).toContain("sometime");
  });
});
