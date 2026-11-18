import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import { API_STT_TRANSCRIBE } from "@/routes";

/** The self-hosted Whisper writes down one spoken answer (multipart);
 * used by "Betulkan kalimat" cards in Ulang. */
export const transcribeAudio = async (
  audio: Blob,
  fileName: string,
  language: "en" | "id" = "en",
): Promise<
  ApiResponse<{ text: string; language: "en" | "id"; durationSec: number }>
> => {
  const form = new FormData();
  form.append("language", language);
  form.append("audio", audio, fileName);
  return (
    await axiosInstance.post(API_STT_TRANSCRIBE, form, {
      // Let the browser set the multipart boundary (default is JSON).
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000,
    })
  ).data;
};
