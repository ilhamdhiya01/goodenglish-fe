import { create } from "zustand";

import type { AiMessage, AiWord } from "@/lib/types/ai.types";

// Percakapan "Tanya AI". Disimpan di localStorage perangkat ini saja (bukan di
// server): tetap ada setelah reload, hilang saat logout atau "Percakapan baru".
const STORAGE_KEY = "ge-ai-chat-v1";
const MAX_MESSAGES = 30;

/** From a word card: a message to send as soon as the panel opens ("cek
 * AI"), or none, to just focus the input ("tanya AI"). */
export type AiPending = { text?: string };

interface AiChatState {
  open: boolean;
  messages: AiMessage[];
  /** The word card the conversation is currently about, if any. */
  word: AiWord | null;
  pending: AiPending | null;
  busy: boolean;

  /** Reads the saved conversation; call once on the client. */
  hydrate: () => void;
  setOpen: (open: boolean) => void;
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
  openWith: (word, pending) =>
    set({ open: true, word, pending: pending ?? null }),
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
    set({ messages: [], word: null, pending: null });
  },
}));
