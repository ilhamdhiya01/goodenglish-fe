import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Modal from "../Modal";

const open = () => {
  const onClose = vi.fn();
  const view = render(
    <Modal label="Ubah token" onClose={onClose}>
      <input aria-label="Nama" />
    </Modal>,
  );
  return { onClose, ...view };
};

describe("Modal", () => {
  it("closes on Escape and locks page scroll while open", () => {
    const { onClose, unmount } = open();
    expect(screen.getByRole("dialog", { name: "Ubah token" })).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on a click outside the box", () => {
    const { onClose } = open();
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking inside the dialog", () => {
    const { onClose } = open();
    fireEvent.mouseDown(screen.getByLabelText("Nama"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
