import { create } from "zustand";

import type { AiMessage, AiWord } from "@/lib/types/ai.types";

// Percakapan "Tanya AI". Isinya disimpan di server per token (lihat
// useAiConversations), jadi sama di semua perangkat. Di perangkat ini cukup
// diingat percakapan mana yang sedang terbuka, supaya muncul lagi setelah
// reload. Hilang saat logout; "Percakapan baru" memulai thread baru tanpa
// menghapus yang lama.
const STORAGE_KEY = "ge-ai-chat-v2";
// Versi lama menyimpan seluruh pesan di sini.
const LEGACY_KEY = "ge-ai-chat-v1";

/** From a word card: a message to send as soon as the panel opens ("cek
 * AI"), or none, to just focus the input ("tanya AI"). */
export type AiPending = { text?: string };

export type AiChatView = "chat" | "history";

interface AiChatState {
  open: boolean;
  view: AiChatView;
  /** The saved thread on screen; null until the server saves a new one. */
  conversationId: string | null;
  messages: AiMessage[];
  /** The word card the conversation is currently about, if any. */
  word: AiWord | null;
  pending: AiPending | null;
  busy: boolean;

  /** The thread that was open on this device, to load on start. */
  hydrate: () => string | null;
  setOpen: (open: boolean) => void;
  setView: (view: AiChatView) => void;
  openWith: (word: AiWord, pending?: AiPending) => void;
  clearWord: () => void;
  takePending: () => AiPending | null;
  setBusy: (busy: boolean) => void;
  setConversationId: (id: string) => void;
  /** Shows a saved thread loaded from the server. */
  load: (id: string, messages: AiMessage[]) => void;
  append: (m: AiMessage) => void;
  update: (id: string, patch: Partial<AiMessage>) => void;
  reset: () => void;
}

const remember = (id: string | null) => {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* full / private mode — ignore */
  }
};

export const useAiChatStore = create<AiChatState>((set, get) => ({
  open: false,
  view: "chat",
  conversationId: null,
  messages: [],
  word: null,
  pending: null,
  busy: false,

  hydrate: () => {
    try {
      localStorage.removeItem(LEGACY_KEY);
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  setOpen: (open) => set({ open }),
  setView: (view) => set({ view }),
  openWith: (word, pending) =>
    set({ open: true, view: "chat", word, pending: pending ?? null }),
  clearWord: () => set({ word: null }),
  takePending: () => {
    const p = get().pending;
    if (p) set({ pending: null });
    return p;
  },
  setBusy: (busy) => set({ busy }),
  setConversationId: (id) => {
    remember(id);
    set({ conversationId: id });
  },
  load: (id, messages) => {
    remember(id);
    set({ conversationId: id, messages, word: null, view: "chat" });
  },
  append: (m) => set((s) => ({ messages: [...s.messages, m] })),
  update: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  reset: () => {
    remember(null);
    set({
      conversationId: null,
      messages: [],
      word: null,
      pending: null,
      view: "chat",
    });
  },
}));

/** Forgets the open conversation (logout, or a new token on this device).
 * The saved threads stay on the server with the token. */
export const clearAiChat = () => {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
  useAiChatStore.getState().reset();
};
