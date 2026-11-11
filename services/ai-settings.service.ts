import axiosInstance from "@/lib/axios";
import type {
  AiModels,
  AiSettings,
  SaveAiSettings,
} from "@/lib/types/ai-settings.types";
import type { ApiResponse } from "@/lib/types/api.types";
import {
  API_ADMIN_AI_KEY,
  API_ADMIN_AI_MODELS,
  API_ADMIN_AI_MODELS_PREVIEW,
  API_ADMIN_AI_SETTINGS,
} from "@/routes";

export const getAiSettings = async (): Promise<ApiResponse<AiSettings>> => {
  try {
    const res = await axiosInstance.get(API_ADMIN_AI_SETTINGS);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const saveAiSettings = async (
  values: SaveAiSettings,
): Promise<ApiResponse<AiSettings>> => {
  try {
    const res = await axiosInstance.put(API_ADMIN_AI_SETTINGS, values);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const removeAiKey = async (): Promise<ApiResponse<AiSettings>> => {
  try {
    const res = await axiosInstance.delete(API_ADMIN_AI_KEY);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getAiModels = async (): Promise<ApiResponse<AiModels>> => {
  try {
    const res = await axiosInstance.get(API_ADMIN_AI_MODELS);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const previewAiModels = async (
  apiKey: string,
): Promise<ApiResponse<AiModels>> => {
  try {
    const res = await axiosInstance.post(API_ADMIN_AI_MODELS_PREVIEW, {
      apiKey,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};
