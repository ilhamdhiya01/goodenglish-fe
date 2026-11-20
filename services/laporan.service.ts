import axiosInstance from "@/lib/axios";
import type { Laporan } from "@/lib/rencana/rencana.contract";
import type { ApiResponse } from "@/lib/types/api.types";
import { API_LAPORAN } from "@/routes";

// The learner's activity log (goodenglish-be laporan).

export const getLaporan = async (
  sejak: number,
): Promise<ApiResponse<Laporan[]>> =>
  (await axiosInstance.get(API_LAPORAN, { params: { sejak } })).data;

export const postLaporan = async (
  items: Laporan[],
): Promise<ApiResponse<{ saved: number }>> =>
  (await axiosInstance.post(API_LAPORAN, { items })).data;
