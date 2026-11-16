import { useSyncExternalStore } from "react";

import {
  preparingText,
  speakingText,
  subscribeSpeaking,
} from "@/lib/helpers/speech.helper";

/** True while exactly this text is being read aloud. */
export const useSpeaking = (text?: string) =>
  useSyncExternalStore(
    subscribeSpeaking,
    () => !!text && speakingText() === text,
    () => false,
  );

/** True while this text's audio is being made (or the voice is loading). */
export const usePreparing = (text?: string) =>
  useSyncExternalStore(
    subscribeSpeaking,
    () => !!text && preparingText() === text,
    () => false,
  );
