import axiosInstance from "@/lib/axios";
import type {
  AccessTokenItem,
  CreatedToken,
  TokenFormValues,
  TokenSummary,
} from "@/lib/types/admin.types";
import type { ApiResponse } from "@/lib/types/api.types";
import {
  API_ADMIN_TOKEN,
  API_ADMIN_TOKEN_ACTIVATE,
  API_ADMIN_TOKEN_REGENERATE,
  API_ADMIN_TOKEN_REVOKE,
  API_ADMIN_TOKEN_SESSIONS,
  API_ADMIN_TOKEN_SUMMARY,
  API_ADMIN_TOKENS,
} from "@/routes";

export const getTokens = async (): Promise<ApiResponse<AccessTokenItem[]>> => {
  try {
    const res = await axiosInstance.get(API_ADMIN_TOKENS);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const createToken = async (
  values: TokenFormValues,
): Promise<ApiResponse<CreatedToken>> => {
  try {
    const { expiresAt, ...rest } = values;
    const res = await axiosInstance.post(API_ADMIN_TOKENS, {
      ...rest,
      ...(expiresAt ? { expiresAt } : {}),
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const updateToken = async (
  id: string,
  values: Partial<TokenFormValues>,
): Promise<ApiResponse<AccessTokenItem>> => {
  try {
    const res = await axiosInstance.patch(API_ADMIN_TOKEN(id), values);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const revokeToken = async (
  id: string,
): Promise<ApiResponse<AccessTokenItem>> => {
  try {
    const res = await axiosInstance.post(API_ADMIN_TOKEN_REVOKE(id));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const activateToken = async (
  id: string,
): Promise<ApiResponse<AccessTokenItem>> => {
  try {
    const res = await axiosInstance.post(API_ADMIN_TOKEN_ACTIVATE(id));
    return res.data;
  } catch (error) {
    throw error;
  }
};

// New plaintext on the same row (progress kept); old token and all its
// devices stop working immediately.
export const regenerateToken = async (
  id: string,
): Promise<ApiResponse<CreatedToken>> => {
  try {
    const res = await axiosInstance.post(API_ADMIN_TOKEN_REGENERATE(id));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const resetTokenSessions = async (
  id: string,
): Promise<ApiResponse<AccessTokenItem>> => {
  try {
    const res = await axiosInstance.delete(API_ADMIN_TOKEN_SESSIONS(id));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const deleteToken = async (id: string): Promise<ApiResponse<null>> => {
  try {
    const res = await axiosInstance.delete(API_ADMIN_TOKEN(id));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getTokenSummary = async (
  id: string,
): Promise<ApiResponse<TokenSummary>> => {
  try {
    const res = await axiosInstance.get(API_ADMIN_TOKEN_SUMMARY(id));
    return res.data;
  } catch (error) {
    throw error;
  }
};
