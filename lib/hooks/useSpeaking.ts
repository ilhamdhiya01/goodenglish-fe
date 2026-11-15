import { useSyncExternalStore } from "react";

import { speakingText, subscribeSpeaking } from "@/lib/helpers/speech.helper";

/** True while the browser is speaking exactly this text. */
export const useSpeaking = (text?: string) =>
  useSyncExternalStore(
    subscribeSpeaking,
    () => !!text && speakingText() === text,
    () => false,
  );
