import { beforeEach, describe, expect, it } from "vitest";

import { useQuizStore } from "@/stores/useQuizStore";

const session = () => ({
  qs: [
    { word: "go", ex: "", ans: "pergi", prompt: "", opts: ["pergi", "datang"] },
    {
      word: "come",
      ex: "",
      ans: "datang",
      prompt: "",
      opts: ["pergi", "datang"],
    },
  ],
  i: 0,
  score: 0,
  picked: null,
  done: false,
});

describe("useQuizStore misses", () => {
  beforeEach(() => useQuizStore.setState({ session: session() }));

  it("records wrong answers and not right ones", () => {
    const s = useQuizStore.getState();
    s.pick("datang"); // wrong
    s.next();
    useQuizStore.getState().pick("datang"); // right
    const q = useQuizStore.getState().session!;
    expect(q.score).toBe(1);
    expect(q.misses).toEqual([{ word: "go", ans: "pergi", picked: "datang" }]);
  });

  it("ignores a second pick on the same question", () => {
    const s = useQuizStore.getState();
    s.pick("datang");
    s.pick("pergi");
    expect(useQuizStore.getState().session!.misses).toHaveLength(1);
  });
});
