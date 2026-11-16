import { create } from "zustand";

import { KOKORO_SPEEDS, KOKORO_VOICES } from "@/lib/tts/kokoro.types";

// The Kokoro voice (lib/tts), its speaking speed and its loading state. Both
// choices are per device, so they live in localStorage only.

export type KokoroStatus = "idle" | "loading" | "ready" | "error";

const KEY = "vocab-tts-v1";
const DEFAULT_VOICE = KOKORO_VOICES[0][0];
export const DEFAULT_SPEED = 0.95;

type Saved = { kokoroVoice?: string; speed?: number };

const readSaved = (): Saved => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Saved;
  } catch {
    return {};
  }
};

const save = (s: Saved) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readSaved(), ...s }));
  } catch {
    /* private mode: keep it for this visit */
  }
};

const saved = readSaved();

interface TtsState {
  voice: string;
  /** Kokoro speed: 1 is its natural pace, lower is slower. */
  speed: number;
  status: KokoroStatus;
  /** Model download progress, 0–100, while loading. */
  progress: number;
  device: "webgpu" | "wasm" | null;
  error: string;
  setVoice: (v: string) => void;
  setSpeed: (s: number) => void;
}

export const useTtsStore = create<TtsState>((set) => ({
  voice: KOKORO_VOICES.some(([id]) => id === saved.kokoroVoice)
    ? saved.kokoroVoice!
    : DEFAULT_VOICE,
  speed: KOKORO_SPEEDS.some(([v]) => v === saved.speed)
    ? saved.speed!
    : DEFAULT_SPEED,
  status: "idle",
  progress: 0,
  device: null,
  error: "",
  setVoice: (voice) => {
    set({ voice });
    save({ kokoroVoice: voice });
  },
  setSpeed: (speed) => {
    set({ speed });
    save({ speed });
  },
}));
