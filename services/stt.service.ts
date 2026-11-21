import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import { API_STT_TRANSCRIBE } from "@/routes";

/** The self-hosted Whisper writes down one spoken answer (multipart);
 * used by "Betulkan kalimat" cards in Ulang and "Tandai hafal" in Kosakata.
 * `hint`: the phrase the learner is expected to say, when known. It is not
 * shown to Whisper; it makes the server refuse speech that is clearly not
 * English (Whisper would otherwise translate it). */
export const transcribeAudio = async (
  audio: Blob,
  fileName: string,
  language: "en" | "id" = "en",
  hint?: string,
): Promise<
  ApiResponse<{ text: string; language: "en" | "id"; durationSec: number }>
> => {
  const form = new FormData();
  form.append("language", language);
  if (hint) form.append("hint", hint.slice(0, 200));
  form.append("audio", audio, fileName);
  return (
    await axiosInstance.post(API_STT_TRANSCRIBE, form, {
      // Let the browser set the multipart boundary (default is JSON).
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000,
    })
  ).data;
};
