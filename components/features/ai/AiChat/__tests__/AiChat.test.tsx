import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The panel's own behaviour only: the data hooks are stubbed.
vi.mock("@/lib/hooks/ai/useAiChat", () => ({
  MAX_QUESTION: 1000,
  useAiChat: () => ({ ask: vi.fn(), check: vi.fn() }),
  useAiUsage: () => undefined,
}));
vi.mock("@/lib/hooks/ai/useAiSuggestions", () => ({
  useAiSuggestions: () => ["Saran satu", "Saran dua"],
}));

const { default: AiChat } = await import("../AiChat");
const { useAiChatStore } = await import("@/stores/useAiChatStore");

const openPanel = () => {
  render(
    <>
      <button type="button">Tombol di halaman</button>
      <AiChat />
    </>,
  );
  act(() => useAiChatStore.getState().setOpen(true));
};

describe("AiChat panel", () => {
  beforeEach(() => useAiChatStore.setState({ open: false, messages: [] }));

  it("closes when pressing anywhere outside it", () => {
    openPanel();
    expect(screen.getByRole("dialog", { name: "Tanya AI" })).toBeTruthy();

    fireEvent.pointerDown(screen.getByText("Tombol di halaman"));
    expect(useAiChatStore.getState().open).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays open for presses inside it", () => {
    openPanel();
    fireEvent.pointerDown(screen.getByText("Saran satu"));
    fireEvent.pointerDown(screen.getByPlaceholderText("Tulis pertanyaan…"));
    expect(useAiChatStore.getState().open).toBe(true);
  });

  it("still closes on Escape", () => {
    openPanel();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(useAiChatStore.getState().open).toBe(false);
  });
});
