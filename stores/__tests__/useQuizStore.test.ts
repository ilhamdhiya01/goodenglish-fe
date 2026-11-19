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

describe("useQuizStore scope and total", () => {
  it("a week with too few words is tested and logged as all weeks, with its total", async () => {
    const { usePlanStore } = await import("@/stores/usePlanStore");
    const item = (w: number, en: string, id: string) => ({
      w,
      it: ["w", en, "", id] as never,
    });
    const tiny = [item(1, "go", "pergi")];
    const all = Array.from({ length: 12 }, (_, i) =>
      item((i % 3) + 1, "word" + i, "arti" + i),
    );
    useQuizStore.getState().start(tiny, "week", all);
    const s = useQuizStore.getState();
    expect(s.runScope).toBe("all");
    expect(s.session!.qs.length).toBe(12);

    // Answer everything right, then finish.
    for (let i = 0; i < 12; i++) {
      const st = useQuizStore.getState();
      st.pick(st.session!.qs[st.session!.i].ans);
      st.next();
    }
    const last = usePlanStore.getState().plan.quiz!.at(-1)!;
    expect(last).toMatchObject({ scope: "all", score: 12, total: 12 });
  });
});
