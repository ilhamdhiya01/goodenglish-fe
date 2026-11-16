import { create } from "zustand";

import { KOKORO_VOICES } from "@/lib/tts/kokoro.types";

// The Kokoro voice (lib/tts) and its loading state. The chosen voice is per
// device, so it lives in localStorage only.

export type KokoroStatus = "idle" | "loading" | "ready" | "error";

const KEY = "vocab-tts-v1";
const DEFAULT_VOICE = KOKORO_VOICES[0][0];

const readVoice = (): string => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "{}").kokoroVoice;
    return KOKORO_VOICES.some(([id]) => id === v) ? v : DEFAULT_VOICE;
  } catch {
    return DEFAULT_VOICE;
  }
};

interface TtsState {
  voice: string;
  status: KokoroStatus;
  /** Model download progress, 0–100, while loading. */
  progress: number;
  device: "webgpu" | "wasm" | null;
  error: string;
  setVoice: (v: string) => void;
}

export const useTtsStore = create<TtsState>((set) => ({
  voice: typeof window === "undefined" ? DEFAULT_VOICE : readVoice(),
  status: "idle",
  progress: 0,
  device: null,
  error: "",
  setVoice: (voice) => {
    set({ voice });
    try {
      localStorage.setItem(KEY, JSON.stringify({ kokoroVoice: voice }));
    } catch {
      /* private mode: keep it for this visit */
    }
  },
}));
