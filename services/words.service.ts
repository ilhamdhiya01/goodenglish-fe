import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type { SharedWord, SharedWordInput } from "@/lib/types/words.types";
import { API_ADMIN_WORD, API_ADMIN_WORDS, API_WORDS } from "@/routes";

export const getWords = async (): Promise<ApiResponse<SharedWord[]>> => {
  const res = await axiosInstance.get(API_WORDS);
  return res.data;
};

export const createWord = async (
  values: SharedWordInput,
): Promise<ApiResponse<SharedWord>> => {
  const res = await axiosInstance.post(API_ADMIN_WORDS, values);
  return res.data;
};

export const updateWord = async (
  id: string,
  values: Partial<SharedWordInput>,
): Promise<ApiResponse<SharedWord>> => {
  const res = await axiosInstance.patch(API_ADMIN_WORD(id), values);
  return res.data;
};

export const deleteWord = async (id: string): Promise<ApiResponse<null>> => {
  const res = await axiosInstance.delete(API_ADMIN_WORD(id));
  return res.data;
};
