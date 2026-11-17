import { useCallback, useState } from "react";

// The language the learner speaks into the Main peran mic: EN by default,
// ID when they answer in Indonesian. Whisper is told which one (never
// auto-detected: short answers are often detected wrong). Per device.

export type SttLanguage = "en" | "id";

export const STT_LANGUAGE_KEY = "ge-stt-lang-v1";

const read = (): SttLanguage => {
  try {
    return localStorage.getItem(STT_LANGUAGE_KEY) === "id" ? "id" : "en";
  } catch {
    return "en";
  }
};

export const useSttLanguage = () => {
  const [language, setLanguage] = useState<SttLanguage>(read);
  const set = useCallback((l: SttLanguage) => {
    setLanguage(l);
    try {
      localStorage.setItem(STT_LANGUAGE_KEY, l);
    } catch {
      /* private mode: keep it for this visit */
    }
  }, []);
  return [language, set] as const;
};
