import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { usePathname } from "next/navigation";
import { useCallback } from "react";

import { accessErrorText } from "@/const/access.constant";
import { noteOf, type WordNote } from "@/lib/content";
import { useNotes } from "@/lib/hooks/useNotes";
import type { AiContext, AiMessage, AiRole } from "@/lib/types/ai.types";
import type { ErrorResponse } from "@/lib/types/api.types";
import type { LevelId } from "@/lib/types/session.types";
import {
  AiError,
  deleteAiConversation,
  getAiConversation,
  getAiUsage,
  listAiConversations,
  streamChat,
} from "@/services/ai.service";
import { useAiChatStore } from "@/stores/useAiChatStore";
import { useLevelStore } from "@/stores/useLevelStore";

export const aiKeys = {
  usage: ["ai-usage"] as const,
  conversations: ["ai-conversations"] as const,
};

// The backend's limits (ChatDto): 30 turns, a question ≤ 1000 characters,
// earlier answers ≤ 6000.
const HISTORY_TURNS = 30;
export const MAX_QUESTION = 1000;
const MAX_ANSWER = 6000;

const newId = () => Math.random().toString(36).slice(2, 10);

// A word's explanation from the app, flattened so the model answers in line
// with what the card already teaches.
const noteText = (n: WordNote): string =>
  [
    n.core,
    ...(n.forms ?? []).map(([a, b]) => `- ${a}: ${b}`),
    ...(n.traps ?? []).map(
      ([wrong, right, why]) =>
        `- Salah: ${wrong} → Benar: ${right}${why ? ` (${why})` : ""}`,
    ),
  ]
    .join("\n")
    .slice(0, 3000);

// Stored messages → what Gemini sees. Failed replies are dropped, and
// same-role neighbours are merged so the turns alternate and start with the
// learner.
export const toHistory = (messages: AiMessage[]) => {
  const turns: { role: AiRole; text: string }[] = [];
  for (const m of messages) {
    if (m.error || !m.text.trim()) continue;
    const text = m.text;
    const last = turns[turns.length - 1];
    if (last?.role === m.role) last.text += "\n\n" + text;
    else turns.push({ role: m.role, text });
  }
  const recent = turns.slice(-HISTORY_TURNS);
  while (recent[0]?.role === "model") recent.shift();
  return recent.map((t) => ({
    role: t.role,
    text: t.text.slice(0, t.role === "user" ? MAX_QUESTION : MAX_ANSWER),
  }));
};

const errorCode = (err: unknown): string =>
  (err as AxiosError<ErrorResponse>).response?.data?.errors?.[0]?.message ??
  "ai_failed";

const errorText = (err: unknown): string => {
  if (err instanceof AiError)
    return err.status === 401
      ? accessErrorText("session_invalid")
      : accessErrorText(err.message);
  const axiosErr = err as AxiosError<ErrorResponse>;
  if (axiosErr.response?.status === 401)
    return accessErrorText("session_invalid");
  return accessErrorText(axiosErr.message);
};

export const useAiUsage = (enabled: boolean) => {
  const { data } = useQuery({
    queryKey: aiKeys.usage,
    queryFn: getAiUsage,
    select: (r) => r.data,
    enabled,
  });
  return data;
};

// Sends a message (a question, or a sentence to check: the model tells them
// apart), writing both sides of the exchange into useAiChatStore (the answer
// grows as it streams in).
export const useAiChat = () => {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const level = useLevelStore((s) => s.level) as LevelId;
  const week = useLevelStore((s) => s.week);
  const word = useAiChatStore((s) => s.word);
  const notesReady = useNotes(!!word);

  const context = useCallback((): AiContext => {
    const note = word && notesReady ? noteOf(word.word) : null;
    return {
      page: pathname.split("/")[1] || undefined,
      level,
      week,
      ...(word
        ? {
            word: word.word,
            meaning: word.meaning,
            note: note ? noteText(note) : undefined,
          }
        : {}),
    };
  }, [pathname, level, week, word, notesReady]);

  const ask = useCallback(
    async (text: string) => {
      const store = useAiChatStore.getState();
      const question = text.trim().slice(0, MAX_QUESTION);
      if (!question || store.busy) return;

      store.append({
        id: newId(),
        role: "user",
        text: question,
        word: store.word ?? undefined,
      });
      const replyId = newId();
      const history = toHistory(useAiChatStore.getState().messages);
      store.append({ id: replyId, role: "model", text: "" });
      store.setBusy(true);

      try {
        let answer = "";
        await streamChat(
          {
            messages: history,
            context: context(),
            conversationId: store.conversationId ?? undefined,
          },
          {
            onMeta: (id) => useAiChatStore.getState().setConversationId(id),
            onText: (t) => {
              answer += t;
              useAiChatStore.getState().update(replyId, { text: answer });
            },
          },
        );
        if (!answer)
          store.update(replyId, {
            text: accessErrorText("ai_failed"),
            error: true,
          });
      } catch (err) {
        store.update(replyId, { text: errorText(err), error: true });
      } finally {
        store.setBusy(false);
        void queryClient.invalidateQueries({ queryKey: aiKeys.usage });
        void queryClient.invalidateQueries({
          queryKey: aiKeys.conversations,
        });
      }
    },
    [context, queryClient],
  );

  return { ask };
};

/** The saved threads of this token, newest first (the "Riwayat" list). */
export const useAiConversations = (enabled: boolean) =>
  useQuery({
    queryKey: aiKeys.conversations,
    queryFn: listAiConversations,
    select: (r) => r.data,
    enabled,
  });

// Opening and deleting saved threads. Both throw the backend's error code
// (e.g. "ai_conversation_not_found") for the caller to show.
export const useAiConversationActions = () => {
  const queryClient = useQueryClient();

  const open = useCallback(
    async (id: string) => {
      try {
        const { data } = await getAiConversation(id);
        useAiChatStore.getState().load(
          data.id,
          data.messages.map(({ id: mid, role, text, word }) => ({
            id: mid,
            role,
            text,
            word,
          })),
        );
      } catch (err) {
        // Deleted on another device: forget it here too.
        if ((err as AxiosError).response?.status === 404) {
          if (useAiChatStore.getState().conversationId === id)
            useAiChatStore.getState().reset();
          void queryClient.invalidateQueries({
            queryKey: aiKeys.conversations,
          });
        }
        throw new Error(errorCode(err));
      }
    },
    [queryClient],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteAiConversation(id);
      } catch (err) {
        if ((err as AxiosError).response?.status !== 404)
          throw new Error(errorCode(err));
      } finally {
        void queryClient.invalidateQueries({ queryKey: aiKeys.conversations });
      }
      if (useAiChatStore.getState().conversationId === id)
        useAiChatStore.getState().reset();
    },
    [queryClient],
  );

  return { open, remove };
};
