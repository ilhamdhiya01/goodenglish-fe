import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type { LevelId } from "@/lib/types/session.types";
import {
  API_ADMIN_RENCANA_MINGGU,
  API_AI_CHECK_SENTENCES,
  API_RENCANA_MINGGU,
} from "@/routes";
import type { SentenceCheck } from "@/services/ai.service";

// Rencana: the week map (admin) and the "Pakai" sentence check.

export interface PetaMinggu {
  level: LevelId;
  week: number;
  scenarioId: string | null;
  grammarTopic: string | null;
}

export const getPetaMinggu = async (
  level: LevelId,
): Promise<ApiResponse<PetaMinggu[]>> =>
  (await axiosInstance.get(API_RENCANA_MINGGU, { params: { level } })).data;

export const putPetaMinggu = async (body: {
  level: LevelId;
  week: number;
  scenarioId?: string | null;
  grammarTopic?: string | null;
}): Promise<ApiResponse<PetaMinggu | null>> =>
  (await axiosInstance.put(API_ADMIN_RENCANA_MINGGU, body)).data;

/** Up to 3 sentences in one AI call (one Tanya AI question). */
export const checkSentences = async (body: {
  sentences: string[];
  level: LevelId;
}): Promise<ApiResponse<{ checks: SentenceCheck[] }>> =>
  (await axiosInstance.post(API_AI_CHECK_SENTENCES, body)).data;
