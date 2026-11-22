import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/helpers/speech.helper", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  speak: vi.fn(),
}));

const { nextRetry, RetryCard } = await import("../AskPractice");

const q = {
  prompt: "The school was closed ___ the flood.",
  hint: "sebab + kata benda",
  ans: "The school was closed because of the flood.",
  why: "because of + kata benda.",
};
const other = {
  ...q,
  prompt: "His success is ___ hard work.",
  ans: "His success is due to hard work.",
};

// "Terakhir salah · akan muncul lagi" in a practice set.
describe("nextRetry", () => {
  it("a wrong answer is kept with what was answered and why", () => {
    const list = nextRetry([], q, {
      given: "The school was closed because the flood.",
      why: "because diikuti kalimat (S + V).",
    });
    expect(list).toEqual([
      {
        prompt: q.prompt,
        hint: q.hint,
        ans: q.ans,
        why: "because diikuti kalimat (S + V).",
        given: "The school was closed because the flood.",
      },
    ]);
  });

  it("a right answer takes the question off the list", () => {
    const list = nextRetry(
      [
        { ...q, given: "x" },
        { ...other, given: "y" },
      ],
      q,
      null,
    );
    expect(list.map((x) => x.ans)).toEqual([other.ans]);
  });

  it("the same question wrong again is not listed twice, newest last", () => {
    const list = nextRetry([{ ...q }, { ...other }], q, {
      given: "again",
      why: "w",
    });
    expect(list.map((x) => x.ans)).toEqual([other.ans, q.ans]);
    expect(list[1].given).toBe("again");
  });
});

describe("RetryCard", () => {
  it("shows the learner's sentence with the wrong word marked, the right one and why", () => {
    render(
      <RetryCard
        x={{
          ...q,
          given: "The school was closed so the flood.",
          why: "so untuk akibat, bukan sebab.",
        }}
      />,
    );
    const struck = document.querySelector("s")!;
    expect(struck.textContent).toContain("The school was closed so the flood.");
    expect(struck.querySelector("b")?.textContent).toBe("so");
    expect(screen.getByText(q.ans)).toBeTruthy();
    expect(screen.getByText("so untuk akibat, bukan sebab.")).toBeTruthy();
    // The blank question and its cue are no longer needed.
    expect(screen.queryByText(/sebab \+ kata benda/)).toBeNull();
  });

  it("a missing word can't be marked: the sentence is struck, nothing in red", () => {
    render(
      <RetryCard
        x={{
          ...q,
          given: "The school was closed because the flood.",
          why: "w",
        }}
      />,
    );
    const struck = document.querySelector("s")!;
    expect(struck.textContent).toContain(
      "The school was closed because the flood.",
    );
    expect(struck.querySelector("b")).toBeNull();
  });

  it("an entry saved before answers were kept shows the question instead", () => {
    render(<RetryCard x={q} />);
    expect(document.querySelector("s")).toBeNull();
    expect(screen.getByText(q.prompt)).toBeTruthy();
    expect(screen.queryByText(/sebab \+ kata benda/)).toBeNull();
    expect(screen.getByText(q.why)).toBeTruthy();
  });
});
