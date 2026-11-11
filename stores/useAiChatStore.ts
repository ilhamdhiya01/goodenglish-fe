import { create } from "zustand";

import type { AiMessage, AiWord } from "@/lib/types/ai.types";

// Percakapan "Tanya AI". Disimpan di localStorage perangkat ini saja (bukan di
// server): tetap ada setelah reload, hilang saat logout atau "Percakapan baru".
const STORAGE_KEY = "ge-ai-chat-v1";
const MAX_MESSAGES = 30;

/** Something to run as soon as the panel opens (from a word card). */
export type AiPending = { kind: "check"; text: string } | { kind: "ask" };

/** What the input box does: ask a question, or check a sentence. */
export type AiMode = "ask" | "check";

interface AiChatState {
  open: boolean;
  mode: AiMode;
  messages: AiMessage[];
  /** The word card the conversation is currently about, if any. */
  word: AiWord | null;
  pending: AiPending | null;
  busy: boolean;

  /** Reads the saved conversation; call once on the client. */
  hydrate: () => void;
  setOpen: (open: boolean) => void;
  setMode: (mode: AiMode) => void;
  openWith: (word: AiWord, pending?: AiPending) => void;
  clearWord: () => void;
  takePending: () => AiPending | null;
  setBusy: (busy: boolean) => void;
  append: (m: AiMessage) => void;
  update: (id: string, patch: Partial<AiMessage>) => void;
  reset: () => void;
}

const save = (messages: AiMessage[]) => {
  try {
    if (messages.length)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* full / private mode — ignore */
  }
};

/** Drops the saved conversation (logout, or a new token on this device). */
export const clearAiChat = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

export const useAiChatStore = create<AiChatState>((set, get) => ({
  open: false,
  mode: "ask",
  messages: [],
  word: null,
  pending: null,
  busy: false,

  hydrate: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const messages = raw ? (JSON.parse(raw) as AiMessage[]) : [];
      if (Array.isArray(messages)) set({ messages });
    } catch {
      /* corrupt — start empty */
    }
  },
  setOpen: (open) => set({ open }),
  setMode: (mode) => set({ mode }),
  openWith: (word, pending) =>
    set({
      open: true,
      word,
      pending: pending ?? null,
      mode: pending?.kind === "check" ? "check" : "ask",
    }),
  clearWord: () => set({ word: null }),
  takePending: () => {
    const p = get().pending;
    if (p) set({ pending: null });
    return p;
  },
  setBusy: (busy) => set({ busy }),
  append: (m) =>
    set((s) => {
      const messages = [...s.messages, m].slice(-MAX_MESSAGES);
      save(messages);
      return { messages };
    }),
  update: (id, patch) =>
    set((s) => {
      const messages = s.messages.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      );
      save(messages);
      return { messages };
    }),
  reset: () => {
    save([]);
    set({ messages: [], word: null, pending: null, mode: "ask" });
  },
}));
