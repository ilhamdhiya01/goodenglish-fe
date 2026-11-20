import { fireEvent, render, screen, within } from "@testing-library/react";
import React, { useState } from "react";
import { describe, expect, it } from "vitest";

import { Order, orderText } from "../QuestionView";

const tiles = ["they", "Are", "at", "hotel", "the", "Do"].map((t, i) => ({
  t,
  i,
}));

const Harness = () => {
  const [v, setV] = useState("");
  return (
    <>
      <Order tiles={tiles} value={v} onChange={setV} />
      <output data-testid="text">{orderText(tiles, v)}</output>
    </>
  );
};

const text = () => screen.getByTestId("text").textContent;
const tile = (w: string) =>
  screen.getAllByTestId("test-tile").find((b) => b.textContent === w)!;
const placed = (w: string) =>
  within(screen.getByLabelText("Susunanmu")).getByRole("button", { name: w });

// Same as Panduan grammar: a placed word is marked, then swapped or replaced.
describe("Order (susun kata di tes)", () => {
  it("swaps two placed words", () => {
    render(<Harness />);
    ["they", "Are", "at", "the", "hotel"].forEach((w) =>
      fireEvent.click(tile(w)),
    );
    expect(text()).toBe("they Are at the hotel");
    fireEvent.click(placed("they"));
    fireEvent.click(placed("Are"));
    expect(text()).toBe("Are they at the hotel");
  });

  it("replaces a marked word with a tile below, in the same place", () => {
    render(<Harness />);
    ["Do", "they", "at"].forEach((w) => fireEvent.click(tile(w)));
    fireEvent.click(placed("Do"));
    fireEvent.click(tile("Are"));
    expect(text()).toBe("Are they at");
  });

  it("tapping a marked word again cancels; a marked word can be taken out", () => {
    render(<Harness />);
    ["they", "Do"].forEach((w) => fireEvent.click(tile(w)));
    fireEvent.click(placed("Do"));
    fireEvent.click(placed("Do"));
    // Not marked any more: a tile is added at the end.
    fireEvent.click(tile("at"));
    expect(text()).toBe("they Do at");
    fireEvent.click(placed("Do"));
    fireEvent.click(screen.getByRole("button", { name: "Keluarkan kata ini" }));
    expect(text()).toBe("they at");
  });
});
