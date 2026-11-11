import { describe, expect, it } from "vitest";

import type { AiMessage } from "@/lib/types/ai.types";

import { toHistory } from "../useAiChat";

const msg = (role: AiMessage["role"], text: string, extra = {}): AiMessage => ({
  id: Math.random().toString(36),
  role,
  text,
  ...extra,
});

describe("toHistory", () => {
  it("drops failed replies and merges the turns that leaves adjacent", () => {
    const history = toHistory([
      msg("user", "first?"),
      msg("model", "Kuota habis.", { error: true }),
      msg("user", "second?"),
    ]);
    expect(history).toEqual([{ role: "user", text: "first?\n\nsecond?" }]);
  });

  it("turns a sentence check into plain text the model can follow", () => {
    const history = toHistory([
      msg("user", "I has a car.", { isCheck: true }),
      msg("model", "Subjek I memakai have.", {
        check: {
          verdict: "incorrect",
          corrected: "I have a car.",
          explanation: "Subjek I memakai have.",
          alternatives: [],
        },
      }),
      msg("user", "Kenapa bukan has?"),
    ]);
    expect(history[0].text).toBe("Tolong cek kalimat ini: I has a car.");
    expect(history[1].text).toContain("Kalimat yang benar: I have a car.");
    expect(history[2]).toEqual({ role: "user", text: "Kenapa bukan has?" });
  });

  it("keeps at most 10 turns and always starts with the learner", () => {
    const many: AiMessage[] = [];
    for (let i = 0; i < 12; i++)
      many.push(msg(i % 2 ? "model" : "user", `t${i}`));
    many.push(msg("user", "last"));

    const history = toHistory(many);
    expect(history.length).toBeLessThanOrEqual(10);
    expect(history[0].role).toBe("user");
    expect(history[history.length - 1]).toEqual({ role: "user", text: "last" });
  });
});
