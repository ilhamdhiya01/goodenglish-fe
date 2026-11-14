import axiosInstance from "@/lib/axios";
import type {
  AiContext,
  AiConversation,
  AiConversationSummary,
  AiRole,
  AiUsage,
} from "@/lib/types/ai.types";
import type { ApiResponse } from "@/lib/types/api.types";
import {
  API_AI_CHAT,
  API_AI_CONVERSATION,
  API_AI_CONVERSATIONS,
  API_AI_USAGE,
} from "@/routes";

/** A backend error code (see ACCESS_ERRORS), e.g. "ai_quota_exceeded". */
export class AiError extends Error {
  constructor(
    code: string,
    readonly status = 0,
  ) {
    super(code);
  }
}

interface ChatBody {
  messages: { role: AiRole; text: string }[];
  context?: AiContext;
  /** The saved thread to add to; none starts a new one. */
  conversationId?: string;
}

interface ChatHandlers {
  onText: (text: string) => void;
  /** The thread the server saved this exchange in (sent first). */
  onMeta?: (conversationId: string) => void;
}

// POST /ai/chat answers as server-sent events, which axios can't read
// incrementally in the browser — hence fetch + a stream reader. Calls
// onText for each piece of the answer as it arrives.
export const streamChat = async (
  body: ChatBody,
  { onText, onMeta }: ChatHandlers,
  signal?: AbortSignal,
): Promise<void> => {
  const res = await fetch(API_AI_CHAT, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const err = (await res.json().catch(() => null)) as {
      errors?: { message?: string }[];
    } | null;
    throw new AiError(err?.errors?.[0]?.message ?? "ai_failed", res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buf += decoder.decode(value, { stream: true });
    let end: number;
    while ((end = buf.indexOf("\n\n")) >= 0) {
      const frame = buf.slice(0, end);
      buf = buf.slice(end + 2);
      const event = /^event: (.*)$/m.exec(frame)?.[1];
      const data = /^data: (.*)$/m.exec(frame)?.[1];
      if (event === "done") return;
      const parsed = data
        ? (JSON.parse(data) as {
            text?: string;
            message?: string;
            conversationId?: string;
          })
        : {};
      if (event === "meta") {
        if (parsed.conversationId) onMeta?.(parsed.conversationId);
        continue;
      }
      if (event === "error") throw new AiError(parsed.message ?? "ai_failed");
      if (parsed.text) onText(parsed.text);
    }
  }
};

export const getAiUsage = async (): Promise<ApiResponse<AiUsage>> => {
  try {
    const res = await axiosInstance.get(API_AI_USAGE);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const listAiConversations = async (): Promise<
  ApiResponse<AiConversationSummary[]>
> => {
  try {
    const res = await axiosInstance.get(API_AI_CONVERSATIONS);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getAiConversation = async (
  id: string,
): Promise<ApiResponse<AiConversation>> => {
  try {
    const res = await axiosInstance.get(API_AI_CONVERSATION(id));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAiConversation = async (
  id: string,
): Promise<ApiResponse<null>> => {
  try {
    const res = await axiosInstance.delete(API_AI_CONVERSATION(id));
    return res.data;
  } catch (error) {
    throw error;
  }
};
