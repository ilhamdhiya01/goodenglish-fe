import { describe, expect, it } from "vitest";

import { practiceOf } from "../practice-ref.helper";

// Grammar practice mistakes carry refId "<set id>:<answer>" (AskPractice).
describe("practiceOf", () => {
  it("finds the bank set a grammar mistake came from", () => {
    expect(
      practiceOf({ source: "Grammar", refId: "conj1:because of the rain" }),
    ).toMatchObject({
      sub: "conj",
      subLabel: "Kata sambung",
      topic: "conj",
      setId: "conj1",
      no: "SET 1",
      title: "Because / because of / so",
      detail: expect.stringContaining("because of + kata benda"),
    });
  });

  it("maps Was / Have / Been sets to their sub-tab", () => {
    expect(practiceOf({ source: "Grammar", refId: "whb3:x" })?.sub).toBe(
      "been",
    );
  });

  it("finds a Bertanya formula", () => {
    expect(
      practiceOf({ source: "Grammar", refId: "r2:Where do you live?" }),
    ).toMatchObject({
      sub: "ask",
      topic: "ask",
      setId: "r2",
      no: "Rumus 2",
      title: "Pertanyaan WH",
    });
  });

  it("is null for other sources, unknown sets and missing refId", () => {
    expect(practiceOf({ source: "Tanya AI", refId: "conj1:x" })).toBeNull();
    expect(practiceOf({ source: "Grammar", refId: "nope:x" })).toBeNull();
    expect(practiceOf({ source: "Grammar" })).toBeNull();
  });
});
