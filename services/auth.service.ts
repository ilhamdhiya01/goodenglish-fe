import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type { RedeemPayload, SessionData } from "@/lib/types/session.types";
import { API_AUTH_LOGOUT, API_AUTH_ME, API_AUTH_REDEEM } from "@/routes";

export const redeemToken = async (
  payload: RedeemPayload,
): Promise<ApiResponse<SessionData>> => {
  try {
    const res = await axiosInstance.post(API_AUTH_REDEEM, payload);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getSession = async (): Promise<ApiResponse<SessionData>> => {
  try {
    const res = await axiosInstance.get(API_AUTH_ME);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async (): Promise<ApiResponse<null>> => {
  try {
    const res = await axiosInstance.post(API_AUTH_LOGOUT);
    return res.data;
  } catch (error) {
    throw error;
  }
};
