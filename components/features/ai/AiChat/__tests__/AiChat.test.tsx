import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The panel's own behaviour only: the data hooks are stubbed.
const { ask, openSaved, removeSaved, conversations } = vi.hoisted(() => ({
  ask: vi.fn(),
  openSaved: vi.fn(() => Promise.resolve()),
  removeSaved: vi.fn(() => Promise.resolve()),
  conversations: [
    {
      id: "c1",
      title: "Apa itu lesson?",
      updatedAt: "2026-11-14T06:00:00.000Z",
      messageCount: 2,
    },
  ],
}));
vi.mock("@/lib/hooks/ai/useAiChat", () => ({
  MAX_QUESTION: 1000,
  useAiChat: () => ({ ask }),
  useAiUsage: () => undefined,
  // Stable functions, like the real useCallback ones.
  useAiConversationActions: () => ({ open: openSaved, remove: removeSaved }),
  useAiConversations: () => ({
    data: conversations,
    isLoading: false,
    isError: false,
  }),
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
  beforeEach(() => {
    ask.mockClear();
    openSaved.mockClear();
    removeSaved.mockClear();
    localStorage.clear();
    useAiChatStore.setState({
      open: false,
      view: "chat",
      conversationId: null,
      messages: [],
      pending: null,
    });
  });

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
    fireEvent.pointerDown(screen.getByPlaceholderText(/Tanya apa saja/));
    expect(useAiChatStore.getState().open).toBe(true);
  });

  it("still closes on Escape", () => {
    openPanel();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(useAiChatStore.getState().open).toBe(false);
  });

  it('sends the sentence right away from a card\'s "cek AI"', () => {
    render(<AiChat />);
    const text = 'Cek kalimatku dengan kata "commute": I commute by bus.';
    act(() =>
      useAiChatStore.getState().openWith({ word: "commute" }, { text }),
    );
    expect(ask).toHaveBeenCalledWith(text);
  });

  it('only focuses the input from a card\'s "tanya AI"', () => {
    render(<AiChat />);
    act(() => useAiChatStore.getState().openWith({ word: "commute" }, {}));
    expect(ask).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      screen.getByPlaceholderText(/Tanya apa saja/),
    );
    expect(screen.getByText("Kata: commute")).toBeTruthy();
  });

  it("reopens the thread this device had open, once", () => {
    localStorage.setItem("ge-ai-chat-v2", "c1");
    render(<AiChat />);
    act(() => useAiChatStore.getState().setOpen(true));
    expect(openSaved).toHaveBeenCalledTimes(1);
    expect(openSaved).toHaveBeenCalledWith("c1");
  });

  it("lists saved threads under Riwayat and opens or deletes one", () => {
    openPanel();
    fireEvent.click(screen.getByRole("button", { name: "Riwayat" }));
    expect(screen.queryByPlaceholderText(/Tanya apa saja/)).toBeNull();

    fireEvent.click(screen.getByText("Apa itu lesson?"));
    expect(openSaved).toHaveBeenCalledWith("c1");

    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(
      screen.getByRole("button", { name: "Hapus percakapan: Apa itu lesson?" }),
    );
    expect(removeSaved).toHaveBeenCalledWith("c1");
  });

  it('"Percakapan baru" starts a new thread without deleting the old one', () => {
    openPanel();
    act(() =>
      useAiChatStore
        .getState()
        .load("c1", [{ id: "m1", role: "user", text: "Halo" }]),
    );
    fireEvent.click(screen.getByRole("button", { name: "Percakapan baru" }));
    expect(useAiChatStore.getState().conversationId).toBeNull();
    expect(useAiChatStore.getState().messages).toEqual([]);
    expect(removeSaved).not.toHaveBeenCalled();
  });
});
