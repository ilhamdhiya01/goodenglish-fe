import { create } from "zustand";

import { loadStr, saveStr, STORAGE_KEYS } from "@/lib/helpers/storage.helper";
import type { FormState } from "@/lib/types/vocab.types";

// State UI halaman Kosakata: pencarian, filter jenis, mode tes/ketik, arah kartu
// (Inggris→Indo atau sebaliknya), kartu yang dibuka, sorotan hasil "lompat ke kata",
// dan form Kataku. `flip` dipersist — juga dipakai halaman Ulangan.

interface VocabUiState {
  q: string;
  type: string;
  hideKnown: boolean;
  quiz: boolean;
  flip: boolean;
  recall: boolean;
  revealed: Record<string, 1>;
  focusKey: string;
  form: FormState | null;
  formErr: string;

  setQ: (s: string) => void;
  setType: (t: string) => void;
  setHideKnown: (b: boolean) => void;
  setQuiz: (b: boolean) => void;
  setFlip: (b: boolean) => void;
  setRecall: (b: boolean) => void;
  reveal: (k: string) => void;
  clearRevealed: () => void;
  /** Sorot satu kartu ~5 detik (dipakai "lompat ke kata" dari pencarian global). */
  flashFocus: (k: string) => void;
  openForm: (f: FormState) => void;
  closeForm: () => void;
  setForm: (f: FormState | null) => void;
  setFormErr: (s: string) => void;
  /** Bersihkan filter — dipakai saat lompat ke kata lain / ganti level. */
  resetBrowse: () => void;
  /** Re-read the persisted card direction from the progress snapshot. */
  hydrate: () => void;
}

let focusTimer: ReturnType<typeof setTimeout> | undefined;

export const useVocabUiStore = create<VocabUiState>((set) => ({
  q: "",
  type: "all",
  hideKnown: false,
  quiz: false,
  flip: loadStr(STORAGE_KEYS.flip) === "1",
  hydrate: () => set({ flip: loadStr(STORAGE_KEYS.flip) === "1" }),
  recall: false,
  revealed: {},
  focusKey: "",
  form: null,
  formErr: "",

  setQ: (q) => set({ q }),
  setType: (type) => set({ type }),
  setHideKnown: (hideKnown) => set({ hideKnown }),
  // Kartu yang sudah dibuka direset tiap mode tes dinyalakan/dimatikan, supaya semua tertutup lagi.
  setQuiz: (quiz) => set({ quiz, revealed: {} }),
  setFlip: (flip) => {
    saveStr(STORAGE_KEYS.flip, flip ? "1" : "0");
    set({ flip, revealed: {} });
  },
  setRecall: (recall) => set({ recall }),
  reveal: (k) => set((s) => ({ revealed: { ...s.revealed, [k]: 1 } })),
  clearRevealed: () => set({ revealed: {} }),

  flashFocus: (k) => {
    if (focusTimer) clearTimeout(focusTimer);
    set({ focusKey: "" });
    setTimeout(() => set({ focusKey: k }), 0);
    focusTimer = setTimeout(() => set({ focusKey: "" }), 5000);
  },

  openForm: (form) => set({ form, formErr: "" }),
  closeForm: () => set({ form: null, formErr: "" }),
  setForm: (form) => set({ form }),
  setFormErr: (formErr) => set({ formErr }),

  resetBrowse: () =>
    set({ q: "", type: "all", hideKnown: false, revealed: {}, focusKey: "" }),
}));
