import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type {
  RoleplayContext,
  RoleplayHelp,
  RoleplayLine,
  RoleplayStarted,
  RoleplaySummary,
  RoleplayTurn,
  RoleplayUsage,
} from "@/lib/types/roleplay.types";
import {
  API_ROLEPLAY_FINISH,
  API_ROLEPLAY_HELP,
  API_ROLEPLAY_SESSIONS,
  API_ROLEPLAY_TRANSCRIBE,
  API_ROLEPLAY_TURN,
  API_ROLEPLAY_USAGE,
} from "@/routes";

// "Main peran" (goodenglish-be src/modules/roleplay). The client keeps the
// transcript and sends it whole on every call.

export const getRoleplayUsage = async (): Promise<ApiResponse<RoleplayUsage>> =>
  (await axiosInstance.get(API_ROLEPLAY_USAGE)).data;

export const startRoleplay = async (body: {
  scenarioId: string;
  context: RoleplayContext;
}): Promise<ApiResponse<RoleplayStarted>> =>
  (await axiosInstance.post(API_ROLEPLAY_SESSIONS, body)).data;

export const sendRoleplayTurn = async (
  id: string,
  transcript: RoleplayLine[],
): Promise<ApiResponse<RoleplayTurn>> =>
  (await axiosInstance.post(API_ROLEPLAY_TURN(id), { transcript })).data;

export const askRoleplayHelp = async (
  id: string,
  transcript: RoleplayLine[],
): Promise<ApiResponse<RoleplayHelp>> =>
  (await axiosInstance.post(API_ROLEPLAY_HELP(id), { transcript })).data;

/** The self-hosted Whisper writes down one spoken answer (multipart). */
export const transcribeRoleplay = async (
  id: string,
  audio: Blob,
  fileName: string,
  language: "en" | "id",
): Promise<
  ApiResponse<{
    text: string;
    language: "en" | "id";
    durationSec: number;
    transcribeLeft: number;
  }>
> => {
  const form = new FormData();
  form.append("language", language);
  form.append("audio", audio, fileName);
  return (
    await axiosInstance.post(API_ROLEPLAY_TRANSCRIBE(id), form, {
      // The instance default is JSON, which would make axios turn the form
      // into JSON. With this, axios leaves the body alone and the browser
      // sets the multipart boundary itself.
      headers: { "Content-Type": "multipart/form-data" },
      // A 60 s answer on the 2-vCPU server can take a while.
      timeout: 60_000,
    })
  ).data;
};

export const finishRoleplay = async (
  id: string,
  transcript: RoleplayLine[],
  durationSec: number,
): Promise<ApiResponse<RoleplaySummary>> =>
  (
    await axiosInstance.post(API_ROLEPLAY_FINISH(id), {
      transcript,
      durationSec,
    })
  ).data;
