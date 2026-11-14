import { afterEach, describe, expect, it, vi } from "vitest";

import { streamChat } from "../ai.service";

// POST /ai/chat as the backend sends it, split at awkward places.
const sseResponse = (...parts: string[]) => {
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      parts.forEach((p) => c.enqueue(enc.encode(p)));
      c.close();
    },
  });
  return new Response(body, { status: 200 });
};

describe("streamChat", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reports the saved thread first, then the answer", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        sseResponse(
          'event: meta\ndata: {"conversationId":"c1"}\n\n',
          'data: {"text":"Hal',
          'o"}\n\ndata: {"text":"!"}\n\n',
          "event: done\ndata: {}\n\n",
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const events: string[] = [];

    await streamChat(
      { messages: [{ role: "user", text: "Hi" }], conversationId: "c1" },
      {
        onMeta: (id) => events.push(`meta:${id}`),
        onText: (t) => events.push(t),
      },
    );

    expect(events).toEqual(["meta:c1", "Halo", "!"]);
    const sent = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    ) as { conversationId?: string };
    expect(sent.conversationId).toBe("c1");
  });
});
