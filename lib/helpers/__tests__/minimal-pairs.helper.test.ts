import { describe, expect, it } from "vitest";

import {
  buildPairQuestions,
  carrierText,
  resultsBySound,
  soundGroups,
} from "../minimal-pairs.helper";

describe("soundGroups", () => {
  const groups = soundGroups();
  const all = groups.flatMap((g) => g.pairs.flatMap((p) => [p.a, p.b]));

  it("only keeps real-word pairs, without mispronunciations or rude words", () => {
    expect(all.some((w) => /✗/.test(w))).toBe(false);
    for (const bad of ["tink", "werk", "furst", "shit", "bitch", "piss"])
      expect(all).not.toContain(bad);
    expect(all).toEqual(expect.arrayContaining(["ship", "sip", "van", "fan"]));
  });

  it("covers th, z and r/l with the added word pairs", () => {
    const th = groups.find((g) => g.name === "th")!;
    expect(th.pairs.map((p) => `${p.a}/${p.b}`)).toContain("think/sink");
    expect(groups.find((g) => g.name === "z bergetar")).toBeDefined();
    expect(groups.find((g) => g.name === "r di akhir kata")!.pairs[0].a).toBe(
      "right",
    );
    expect(groups.length).toBe(8);
  });
});

describe("buildPairQuestions", () => {
  it("makes 20 questions over every sound, answer among the options", () => {
    const qs = buildPairQuestions(soundGroups(), 20, 5);
    expect(qs).toHaveLength(20);
    expect(new Set(qs.map((q) => q.sound)).size).toBe(8);
    for (const q of qs) {
      expect(q.options).toContain(q.answer);
      expect(new Set(q.options).size).toBe(2);
    }
    expect(buildPairQuestions(soundGroups(), 20, 5)).toEqual(qs);
  });

  it("plays the word in a carrier sentence, alone at stage 3", () => {
    expect(carrierText("ship", 1)).toBe("Say ship again.");
    expect(carrierText("ship", 3)).toBe("ship");
  });
});

describe("resultsBySound", () => {
  it("groups per sound and flags below 70%", () => {
    const groups = soundGroups();
    const r = resultsBySound(groups, [
      { sound: "th", right: true },
      { sound: "th", right: false },
      { sound: "th", right: false },
      { sound: "v · f", right: true },
      { sound: "v · f", right: true },
    ]);
    expect(r.map((s) => [s.sound, s.right, s.total, s.needsWork])).toEqual([
      ["th", 1, 3, true],
      ["v · f", 2, 2, false],
    ]);
  });
});
