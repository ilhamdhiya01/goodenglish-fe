import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/helpers/progress-sync.helper", () => ({
  queueProgress: vi.fn(),
}));

const { default: CheckResultCard } = await import("../CheckResultCard");

describe("CheckResultCard", () => {
  it("lists each typo as wrong → right", () => {
    render(
      <CheckResultCard
        result={{
          verdict: "almost",
          corrected: "I sometimes go to school.",
          explanation: "Ada dua salah ketik.",
          alternatives: [],
          typos: [
            { wrong: "somtimes", correct: "sometimes" },
            { wrong: "skool", correct: "school" },
          ],
        }}
      />,
    );
    expect(screen.getByText("SALAH KETIK")).toBeTruthy();
    expect(screen.getByText("skool").tagName).toBe("S");
    expect(screen.getByText("school").tagName).toBe("B");
  });

  it("still renders checks saved before typos existed", () => {
    render(
      <CheckResultCard
        result={{
          verdict: "correct",
          corrected: "I like tea.",
          explanation: "Sudah benar.",
          alternatives: [],
        }}
      />,
    );
    expect(screen.queryByText("SALAH KETIK")).toBeNull();
    expect(screen.getByText("Sudah benar.")).toBeTruthy();
  });
});
