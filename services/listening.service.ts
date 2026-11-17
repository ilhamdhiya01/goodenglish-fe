import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type {
  GenerateListeningBody,
  ListeningItem,
  UpdateListeningBody,
} from "@/lib/types/listening.types";
import type { LevelId } from "@/lib/types/session.types";
import {
  API_ADMIN_LISTENING,
  API_ADMIN_LISTENING_GENERATE,
  API_ADMIN_LISTENING_ITEM,
  API_ADMIN_LISTENING_PUBLISH,
  API_ADMIN_LISTENING_UNPUBLISH,
  API_LISTENING_ITEMS,
} from "@/routes";

// "Menyimak › Dengar & jawab" question bank (goodenglish-be listening).

/** Learners: published items of one level. */
export const getListeningItems = async (
  level: LevelId,
): Promise<ApiResponse<ListeningItem[]>> =>
  (await axiosInstance.get(API_LISTENING_ITEMS, { params: { level } })).data;

/** Admin: everything, drafts included. */
export const getAdminListening = async (params: {
  level?: LevelId;
  week?: number;
}): Promise<ApiResponse<ListeningItem[]>> =>
  (await axiosInstance.get(API_ADMIN_LISTENING, { params })).data;

export const generateListening = async (
  body: GenerateListeningBody,
): Promise<ApiResponse<{ items: ListeningItem[]; failed: number }>> =>
  // Gemini writes each item; a few at once can take a while.
  (
    await axiosInstance.post(API_ADMIN_LISTENING_GENERATE, body, {
      timeout: 120_000,
    })
  ).data;

export const updateListening = async (
  id: string,
  body: UpdateListeningBody,
): Promise<ApiResponse<ListeningItem>> =>
  (await axiosInstance.patch(API_ADMIN_LISTENING_ITEM(id), body)).data;

export const setListeningPublished = async (
  id: string,
  published: boolean,
): Promise<ApiResponse<ListeningItem>> =>
  (
    await axiosInstance.post(
      published
        ? API_ADMIN_LISTENING_PUBLISH(id)
        : API_ADMIN_LISTENING_UNPUBLISH(id),
    )
  ).data;

export const deleteListening = async (id: string): Promise<ApiResponse<null>> =>
  (await axiosInstance.delete(API_ADMIN_LISTENING_ITEM(id))).data;
