import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/helpers/speech.helper", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  speak: vi.fn(),
}));

const {
  default: KnownProof,
  judgeTyped,
  looseTarget,
  proofMode,
  spacedOtherwise,
} = await import("../KnownProof");

const lesson = {
  en: "lesson",
  id: "pelajaran / les",
  type: "w",
  ex: "I have an English lesson on Monday.",
  target: [18, 24] as [number, number],
};

const setup = (props = {}) => {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  render(
    <KnownProof {...lesson} onDone={onDone} onCancel={onCancel} {...props} />,
  );
  return { onDone, onCancel };
};
const answer = (text: string) => {
  fireEvent.change(screen.getByLabelText(/Ketik (kata|ungkapan) Inggris/), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cek" }));
};

describe("proofMode", () => {
  it("types words and says expressions and openers", () => {
    expect(proofMode("w", "lesson")).toBe("type");
    expect(proofMode("col", "make a reservation in advance")).toBe("type");
    expect(proofMode("ex", "Thanks a lot.")).toBe("say");
    expect(proofMode("st", "To be honest,")).toBe("say");
  });
});

describe("judgeTyped", () => {
  it("ignores case, punctuation and how contractions or numbers are written", () => {
    expect(judgeTyped("lesson", "Lesson")).toBe("ok");
    expect(judgeTyped("Thanks a lot.", "thanks a lot")).toBe("ok");
    expect(judgeTyped("I'm tired.", "I am tired")).toBe("ok");
    expect(
      judgeTyped("I'll be there in 10 minutes.", "ill be there in ten minutes"),
    ).toBe("ok");
  });

  it("accepts a slip of one letter per 12, none in short words", () => {
    expect(judgeTyped("lesson", "leson")).toBe("near");
    expect(judgeTyped("I'll get back to you.", "ill get bakc to you")).toBe(
      "near",
    );
    expect(judgeTyped("lesson", "lxssxn")).toBe("bad");
    expect(judgeTyped("cat", "cot")).toBe("bad");
    expect(judgeTyped("lesson", "class")).toBe("bad");
  });

  // "…" in a pattern card is a blank: any words, the dots, or nothing.
  it("lets the learner fill the … of a pattern with any words", () => {
    expect(judgeTyped("What does … mean?", "what does it mean ?")).toBe("ok");
    expect(judgeTyped("What does … mean?", "What does deadline mean")).toBe(
      "ok",
    );
    expect(judgeTyped("What does … mean?", "what does ... mean?")).toBe("ok");
    expect(judgeTyped("What does … mean?", "what does mean")).toBe("ok");
    expect(judgeTyped("My name is …", "My name is Budi Santoso.")).toBe("ok");
    expect(
      judgeTyped("Can I have …, please?", "can I have a cup of tea, please"),
    ).toBe("ok");
    expect(judgeTyped("I'm going to …", "im going to go to Bali")).toBe("ok");
    expect(
      judgeTyped("Is there a … near here?", "is there a bank near here"),
    ).toBe("ok");
  });

  it("still checks the words around the …", () => {
    expect(judgeTyped("What does … mean?", "what do it mean")).toBe("bad");
    expect(judgeTyped("What does … mean?", "it mean")).toBe("bad");
    expect(judgeTyped("What does … mean?", "what does it mean please")).toBe(
      "bad",
    );
    expect(judgeTyped("My name is …", "I am Budi")).toBe("bad");
    expect(judgeTyped("What does … mean?", "what doe mean")).toBe("near");
  });

  // "work space" for workspace was a slip (Ragu) though the word was known.
  it("takes another spacing or hyphen of the same word", () => {
    expect(judgeTyped("workspace", "work space")).toBe("ok");
    expect(judgeTyped("seat belt", "seatbelt")).toBe("ok");
    expect(judgeTyped("email", "e-mail")).toBe("ok");
    expect(judgeTyped("ballpark figure", "ball park figure")).toBe("ok");
  });

  it("is wrong where the spacing makes another word", () => {
    expect(judgeTyped("maybe", "may be")).toBe("bad");
    expect(judgeTyped("every day", "everyday")).toBe("bad");
    expect(judgeTyped("check-in", "check in")).toBe("bad");
    expect(judgeTyped("takeout", "take out")).toBe("bad");
    expect(judgeTyped("its", "it's")).not.toBe("ok");
  });
});

describe("spacedOtherwise", () => {
  it("is only about spaces and hyphens", () => {
    expect(spacedOtherwise("workspace", "Work space")).toBe(true);
    expect(spacedOtherwise("workspace", "Workspace.")).toBe(false);
    expect(spacedOtherwise("its", "it's")).toBe(false);
  });
});

describe("looseTarget", () => {
  it("finds the answer in the example despite its final punctuation", () => {
    const ex = "What’s the weather like in Bandung?";
    expect(looseTarget(ex, "What's the weather like?")).toEqual([0, 23]);
    expect(looseTarget(ex, "sunny")).toBeNull();
    expect(looseTarget(undefined, "sunny")).toBeNull();
  });
});

describe("KnownProof › typing", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("hides the word behind one field and hints its first letter", () => {
    setup();
    expect(screen.queryByText("lesson")).toBeNull();
    expect(screen.getByText("pelajaran / les")).toBeTruthy();
    expect(
      screen.getByLabelText('Ketik kata Inggris untuk "pelajaran / les"'),
    ).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Diawali “l”");
  });

  it("fills the example's blank while typing", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/Ketik kata Inggris/), {
      target: { value: "less" },
    });
    expect(screen.getByText("less")).toBeTruthy();
  });

  it("marks known after a right answer", () => {
    const { onDone } = setup();
    answer("lesson");
    expect(screen.getByRole("status").textContent).toContain("✓ Tepat!");
    act(() => vi.advanceTimersByTime(1000));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("shows the usual spelling when the spacing differs", () => {
    setup({ en: "workspace", id: "ruang kerja", ex: "", target: null });
    answer("work space");
    expect(screen.getByRole("status").textContent).toContain(
      "✓ Tepat! Biasanya ditulis workspace.",
    );
  });

  it("shows the answer on a wrong word and lets the learner retry", () => {
    const { onDone } = setup();
    answer("class");
    expect(screen.getByRole("status").textContent).toMatch(
      /Jawabannya lesson\. Coba lagi/,
    );
    act(() => vi.advanceTimersByTime(3000));
    expect(onDone).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    answer("lesson");
    act(() => vi.advanceTimersByTime(1000));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("accepts a one-letter slip and shows the spelling", () => {
    const { onDone } = setup();
    answer("leson");
    expect(screen.getByRole("status").textContent).toContain(
      "Hampir, ejaannya lesson",
    );
    act(() => vi.advanceTimersByTime(1700));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("types expressions in the same field when there is no microphone", () => {
    const { onDone } = setup({
      en: "I'll be there in 10 minutes.",
      id: "Aku sampai 10 menit lagi.",
      type: "ex",
      ex: "Don't worry, I'll be there in 10 minutes.",
      target: [13, 41],
    });
    expect(screen.getByRole("status").textContent).toContain("10 atau ten");
    answer("I'll be there in 10 minutes");
    act(() => vi.advanceTimersByTime(1000));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("shows the answer once, without a doubled full stop", () => {
    setup({ en: "Thanks a lot.", id: "Makasih banyak.", type: "ex" });
    answer("thank you");
    expect(screen.getByRole("status").textContent).toMatch(
      /Jawabannya Thanks a lot\. Coba lagi/,
    );
  });

  it("never shows the example whole while asking", () => {
    // The card's own match missed it ("?" vs "… in Bandung?"): blank it anyway.
    setup({
      en: "What's the weather like?",
      id: "Cuacanya bagaimana?",
      type: "ex",
      ex: "What's the weather like in Bandung?",
      target: null,
    });
    expect(screen.queryByText(/weather/)).toBeNull();
    expect(screen.getByText(/in Bandung\?/)).toBeTruthy();
  });

  it("leaves out an example the answer can't be blanked in", () => {
    setup({ ex: "We study together.", target: null });
    expect(screen.queryByText(/study together/)).toBeNull();
  });

  it("cancels without marking", () => {
    const { onDone, onCancel } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
  });
});
