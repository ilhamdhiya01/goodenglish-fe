import { create } from "zustand";

import {
  bestVoice,
  setVoice as persistVoice,
  voices,
} from "@/lib/helpers/speech.helper";

// Daftar suara TTS dimuat asinkron (Chrome: event voiceschanged); init() dipanggil
// sekali dari bootstrap provider.

interface VoiceState {
  list: SpeechSynthesisVoice[];
  current: string;
  init: () => void;
  select: (name: string) => void;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  list: voices(),
  current: bestVoice()?.name || "",

  init: () => {
    try {
      if (!window.speechSynthesis) return;
      const refresh = () => {
        const list = voices();
        set({ list });
        if (!get().current && list.length) {
          const b = bestVoice();
          if (b) set({ current: b.name });
        }
      };
      window.speechSynthesis.addEventListener("voiceschanged", refresh);
      window.speechSynthesis.getVoices();
      refresh();
    } catch {
      /* ignore */
    }
  },

  select: (name) => {
    persistVoice(name);
    set({ current: name });
  },
}));
