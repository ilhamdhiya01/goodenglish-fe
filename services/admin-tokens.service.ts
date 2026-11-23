import axiosInstance from "@/lib/axios";
import type {
  AccessTokenItem,
  CreatedToken,
  LearnerOverview,
  TokenFormValues,
  TokenSummary,
} from "@/lib/types/admin.types";
import type { ApiResponse } from "@/lib/types/api.types";
import type { ProgressMap } from "@/lib/types/progress-sync.types";
import {
  API_ADMIN_LEARNERS,
  API_ADMIN_TOKEN,
  API_ADMIN_TOKEN_ACTIVATE,
  API_ADMIN_TOKEN_PROGRESS,
  API_ADMIN_TOKEN_REGENERATE,
  API_ADMIN_TOKEN_REVOKE,
  API_ADMIN_TOKEN_SESSIONS,
  API_ADMIN_TOKEN_SUMMARY,
  API_ADMIN_TOKENS,
} from "@/routes";

export const getTokens = async (): Promise<ApiResponse<AccessTokenItem[]>> => {
  const res = await axiosInstance.get(API_ADMIN_TOKENS);
  return res.data;
};

export const createToken = async (
  values: TokenFormValues,
): Promise<ApiResponse<CreatedToken>> => {
  const { expiresAt, ...rest } = values;
  const res = await axiosInstance.post(API_ADMIN_TOKENS, {
    ...rest,
    ...(expiresAt ? { expiresAt } : {}),
  });
  return res.data;
};

export const updateToken = async (
  id: string,
  values: Partial<TokenFormValues>,
): Promise<ApiResponse<AccessTokenItem>> => {
  const res = await axiosInstance.patch(API_ADMIN_TOKEN(id), values);
  return res.data;
};

export const revokeToken = async (
  id: string,
): Promise<ApiResponse<AccessTokenItem>> => {
  const res = await axiosInstance.post(API_ADMIN_TOKEN_REVOKE(id));
  return res.data;
};

export const activateToken = async (
  id: string,
): Promise<ApiResponse<AccessTokenItem>> => {
  const res = await axiosInstance.post(API_ADMIN_TOKEN_ACTIVATE(id));
  return res.data;
};

// New plaintext on the same row (progress kept); old token and all its
// devices stop working immediately.
export const regenerateToken = async (
  id: string,
): Promise<ApiResponse<CreatedToken>> => {
  const res = await axiosInstance.post(API_ADMIN_TOKEN_REGENERATE(id));
  return res.data;
};

export const resetTokenSessions = async (
  id: string,
): Promise<ApiResponse<AccessTokenItem>> => {
  const res = await axiosInstance.delete(API_ADMIN_TOKEN_SESSIONS(id));
  return res.data;
};

export const deleteToken = async (id: string): Promise<ApiResponse<null>> => {
  const res = await axiosInstance.delete(API_ADMIN_TOKEN(id));
  return res.data;
};

export const getTokenSummary = async (
  id: string,
): Promise<ApiResponse<TokenSummary>> => {
  const res = await axiosInstance.get(API_ADMIN_TOKEN_SUMMARY(id));
  return res.data;
};

// A learner's raw progress docs, for the read-only "Progres" report.
export const getTokenProgress = async (
  id: string,
): Promise<ApiResponse<ProgressMap>> => {
  const res = await axiosInstance.get(API_ADMIN_TOKEN_PROGRESS(id));
  return res.data;
};

export const getLearnersOverview = async (): Promise<
  ApiResponse<LearnerOverview[]>
> => {
  const res = await axiosInstance.get(API_ADMIN_LEARNERS);
  return res.data;
};
