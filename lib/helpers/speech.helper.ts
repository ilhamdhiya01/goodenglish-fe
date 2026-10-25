import { loadStr, saveStr, STORAGE_KEYS } from "@/lib/helpers/storage.helper";

// TTS Web Speech API + pemilihan suara paling natural yang tersedia.

export const voices = (): SpeechSynthesisVoice[] => {
  try {
    return (
      window.speechSynthesis ? window.speechSynthesis.getVoices() : []
    ).filter((v) => /^en[-_]/i.test(v.lang));
  } catch {
    return [];
  }
};

// Urutan preferensi: Google (Chrome), Microsoft Natural (Edge), suara premium Apple,
// lalu en-* mana pun; suara robotic/novelty dihukum.
export const bestVoice = (): SpeechSynthesisVoice | null => {
  const list = voices();
  if (!list.length) return null;
  const saved = loadStr(STORAGE_KEYS.voice);
  if (saved) {
    const s = list.find((v) => v.name === saved);
    if (s) return s;
  }
  const score = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    let s = 0;
    if (/google/.test(n)) s += 50;
    if (/natural|online|neural/.test(n)) s += 60;
    if (
      /samantha|ava|allison|daniel|karen|moira|serena|tessa|zira|aria|jenny|guy/.test(
        n,
      )
    )
      s += 40;
    if (/premium|enhanced/.test(n)) s += 30;
    if (/^en-us$/i.test(v.lang)) s += 10;
    if (/en-gb/i.test(v.lang)) s += 6;
    if (
      /compact|espeak|fred|albert|bad news|bells|boing|bubbles|cellos|deranged|good news|hysterical|junior|kathy|pipe|ralph|trinoids|whisper|zarvox|novelty/.test(
        n,
      )
    )
      s -= 100;
    if (v.localService === false) s += 5;
    return s;
  };
  return [...list].sort((a, b) => score(b) - score(a))[0];
};

export const speak = (text: string) => {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1;
    const v = bestVoice();
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else u.lang = "en-US";
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
};

export const speakAll = (texts: string[]) => {
  try {
    window.speechSynthesis.cancel();
    texts.forEach((t) => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = "en-US";
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    });
  } catch {
    /* ignore */
  }
};

export const setVoice = (name: string) => {
  saveStr(STORAGE_KEYS.voice, name);
  const v = voices().find((x) => x.name === name);
  if (v) {
    const u = new SpeechSynthesisUtterance("Hello, this is how I sound.");
    u.voice = v;
    u.lang = v.lang;
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
};
