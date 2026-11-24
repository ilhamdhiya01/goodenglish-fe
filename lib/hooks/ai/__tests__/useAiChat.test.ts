import { describe, expect, it } from "vitest";

import type { AiMessage } from "@/lib/types/ai.types";

import { cardContext, toHistory } from "../useAiChat";

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

  it("keeps at most 30 turns and always starts with the learner", () => {
    const many: AiMessage[] = [];
    for (let i = 0; i < 34; i++)
      many.push(msg(i % 2 ? "model" : "user", `t${i}`));
    many.push(msg("user", "last"));

    const history = toHistory(many);
    expect(history.length).toBeLessThanOrEqual(30);
    expect(history[0].role).toBe("user");
    expect(history[history.length - 1]).toEqual({ role: "user", text: "last" });
  });
});

describe("cardContext", () => {
  it("sends a word card as word and meaning", () => {
    expect(
      cardContext({ word: "commute", meaning: "pulang-pergi" }, null),
    ).toEqual({
      word: "commute",
      meaning: "pulang-pergi",
      note: undefined,
    });
  });

  // Not as `word`: the server would store the sentence as a word.
  it("sends a mistake card as text and its sentence as the card", () => {
    expect(
      cardContext(
        { word: "She goes to school.", mistake: "Yang benar: …" },
        null,
      ),
    ).toEqual({ mistake: "Yang benar: …", card: "She goes to school." });
  });
});
