import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type { ProgressKey, ProgressMap } from "@/lib/types/progress-sync.types";
import { API_PROGRESS, API_PROGRESS_KEY } from "@/routes";

export const getProgress = async (): Promise<ApiResponse<ProgressMap>> => {
  try {
    const res = await axiosInstance.get(API_PROGRESS);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const putProgress = async (
  key: ProgressKey,
  data: unknown,
): Promise<ApiResponse<null>> => {
  try {
    const res = await axiosInstance.put(API_PROGRESS_KEY(key), { data });
    return res.data;
  } catch (error) {
    throw error;
  }
};
