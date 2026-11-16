import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ErrorScreen from "../ErrorScreen";

describe("ErrorScreen", () => {
  it("says what happened in text, with Jalak as decoration, and retries", () => {
    const reset = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(
      <ErrorScreen error={new Error("boom")} reset={reset} />,
    );
    expect(screen.getByText("Halaman ini gagal dimuat")).toBeTruthy();

    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/brand/jalak-sedih.svg");
    expect(img.getAttribute("alt")).toBe("");
    expect(img.getAttribute("aria-hidden")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
