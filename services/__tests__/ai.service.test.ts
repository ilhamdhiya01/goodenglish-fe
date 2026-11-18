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

  it("hands the hidden sentence check to onCheck, not to the text", async () => {
    const check = {
      original: "She go home.",
      isCorrect: false,
      corrected: "She goes home.",
      explanationId: "Pakai -s.",
      category: "aturan-dasar",
    };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          sseResponse(
            'data: {"text":"Belum tepat."}\n\n',
            `event: check\ndata: ${JSON.stringify(check)}\n\n`,
            "event: done\ndata: {}\n\n",
          ),
        ),
    );
    const texts: string[] = [];
    const checks: unknown[] = [];
    await streamChat(
      { messages: [{ role: "user", text: "She go home." }] },
      { onText: (t) => texts.push(t), onCheck: (c) => checks.push(c) },
    );
    expect(texts).toEqual(["Belum tepat."]);
    expect(checks).toEqual([check]);
  });
});
