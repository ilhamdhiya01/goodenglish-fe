import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

// streamChat sends one piece of the answer, then waits until it is aborted.
vi.mock("@/services/ai.service", () => ({
  AiError: class extends Error {},
  streamChat: vi.fn(
    (
      _body: unknown,
      { onText }: { onText: (t: string) => void },
      signal: AbortSignal,
    ) =>
      new Promise<void>((_, reject) => {
        onText("Run out of ");
        signal.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      }),
  ),
  getAiUsage: vi.fn(),
  listAiConversations: vi.fn(),
  getAiConversation: vi.fn(),
  deleteAiConversation: vi.fn(),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/vocab" }));

const { stopAiAnswer, useAiChat } = await import("../useAiChat");
const { useAiChatStore } = await import("@/stores/useAiChatStore");

describe("stopAiAnswer", () => {
  it("keeps the part of the answer that arrived, not as an error", async () => {
    const qc = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useAiChat(), { wrapper });

    let done: Promise<void>;
    act(() => {
      done = result.current.ask("bedanya run out of?");
    });
    await waitFor(() => expect(useAiChatStore.getState().busy).toBe(true));
    await act(async () => {
      stopAiAnswer();
      await done;
    });

    const reply = useAiChatStore.getState().messages.at(-1)!;
    expect(reply.role).toBe("model");
    expect(reply.text).toBe("Run out of ");
    expect(reply.error).toBeUndefined();
    expect(useAiChatStore.getState().busy).toBe(false);
  });
});
