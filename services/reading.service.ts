import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type {
  GenerateReadingBody,
  LookupResult,
  ReadingText,
  UpdateReadingBody,
} from "@/lib/types/reading.types";
import type { LevelId } from "@/lib/types/session.types";
import {
  API_ADMIN_READING,
  API_ADMIN_READING_GENERATE,
  API_ADMIN_READING_PUBLISH,
  API_ADMIN_READING_TEXT,
  API_ADMIN_READING_UNPUBLISH,
  API_READING_LOOKUP,
  API_READING_TEXTS,
} from "@/routes";

// "Bacaan" texts (goodenglish-be reading).

/** Learners: published texts of one level. */
export const getReadingTexts = async (
  level: LevelId,
): Promise<ApiResponse<ReadingText[]>> =>
  (await axiosInstance.get(API_READING_TEXTS, { params: { level } })).data;

/** Meaning of a word in neither Kosakata nor the glossary (cached server-side). */
export const lookupWord = async (body: {
  word: string;
  level: LevelId;
  sentence?: string;
}): Promise<ApiResponse<LookupResult>> =>
  (await axiosInstance.post(API_READING_LOOKUP, body, { timeout: 40_000 }))
    .data;

/** Admin: everything, drafts included. */
export const getAdminReading = async (params: {
  level?: LevelId;
  week?: number;
}): Promise<ApiResponse<ReadingText[]>> =>
  (await axiosInstance.get(API_ADMIN_READING, { params })).data;

export const generateReading = async (
  body: GenerateReadingBody,
): Promise<ApiResponse<ReadingText>> =>
  // Gemini writes a whole text with translation and questions: give it time.
  (
    await axiosInstance.post(API_ADMIN_READING_GENERATE, body, {
      timeout: 120_000,
    })
  ).data;

export const updateReading = async (
  id: string,
  body: UpdateReadingBody,
): Promise<ApiResponse<ReadingText>> =>
  (await axiosInstance.patch(API_ADMIN_READING_TEXT(id), body)).data;

export const setReadingPublished = async (
  id: string,
  published: boolean,
): Promise<ApiResponse<ReadingText>> =>
  (
    await axiosInstance.post(
      published
        ? API_ADMIN_READING_PUBLISH(id)
        : API_ADMIN_READING_UNPUBLISH(id),
    )
  ).data;

export const deleteReading = async (id: string): Promise<ApiResponse<null>> =>
  (await axiosInstance.delete(API_ADMIN_READING_TEXT(id))).data;
