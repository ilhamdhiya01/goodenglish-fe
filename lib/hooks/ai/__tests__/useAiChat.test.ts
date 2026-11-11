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

  it("sends a sentence to check as an ordinary turn, with its follow-up", () => {
    const history = toHistory([
      msg("user", 'Cek kalimatku dengan kata "commute": I commute to office.'),
      msg("model", "Hampir benar: **I commute to the office.**"),
      msg("user", "kasih contoh kalimat dengan kata ini"),
    ]);
    expect(history.map((t) => t.role)).toEqual(["user", "model", "user"]);
    expect(history[2].text).toBe("kasih contoh kalimat dengan kata ini");
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
