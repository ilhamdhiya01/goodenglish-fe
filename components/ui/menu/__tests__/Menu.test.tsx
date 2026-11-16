import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Menu from "../Menu";

const setup = () => {
  const onExport = vi.fn();
  render(
    <Menu
      label="Menu akun"
      button={(p) => (
        <button type="button" {...p}>
          Akun
        </button>
      )}
    >
      <Menu.Item onSelect={onExport}>Ekspor</Menu.Item>
      <Menu.Item onSelect={() => {}}>Impor</Menu.Item>
      <Menu.Separator />
      <Menu.Item tone="bad" onSelect={() => {}}>
        Keluar
      </Menu.Item>
    </Menu>,
  );
  return { onExport, trigger: screen.getByRole("button", { name: "Akun" }) };
};

describe("Menu", () => {
  it("opens on click, focuses the first item, arrows wrap around", () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const items = screen.getAllByRole("menuitem");
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(items[0], { key: "ArrowUp" });
    expect(document.activeElement).toBe(items[2]);
    fireEvent.keyDown(items[2], { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[0]);
  });

  it("Escape closes and returns focus to the button", () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getAllByRole("menuitem")[0], { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("selecting an item runs it and closes the menu", () => {
    const { trigger, onExport } = setup();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Ekspor" }));
    expect(onExport).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("a click outside closes it", () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
