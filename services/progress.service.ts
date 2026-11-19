import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type {
  ProgressDocResponse,
  ProgressKey,
  ProgressMap,
  ProgressWithVersions,
} from "@/lib/types/progress-sync.types";
import { API_PROGRESS, API_PROGRESS_KEY } from "@/routes";

/**
 * Every document with its version. An older backend ignores the flag and
 * returns the plain map: then versions is null and saves overwrite as before.
 */
export const getProgress = async (): Promise<
  ApiResponse<{
    docs: ProgressMap;
    versions: ProgressWithVersions["versions"] | null;
  }>
> => {
  const res = await axiosInstance.get(API_PROGRESS, {
    params: { withVersions: 1 },
  });
  const body = res.data as ApiResponse<ProgressWithVersions | ProgressMap>;
  const d = body.data as Partial<ProgressWithVersions> | undefined;
  const isVersioned =
    !!d && typeof d === "object" && "versions" in d && "docs" in d;
  return {
    ...body,
    data: isVersioned
      ? { docs: d.docs ?? {}, versions: d.versions ?? {} }
      : { docs: (body.data as ProgressMap) ?? {}, versions: null },
  } as ApiResponse<{
    docs: ProgressMap;
    versions: ProgressWithVersions["versions"] | null;
  }>;
};

export const getProgressDoc = async (
  key: ProgressKey,
): Promise<ProgressDocResponse> => {
  const res = await axiosInstance.get(API_PROGRESS_KEY(key));
  return (
    (res.data as ApiResponse<ProgressDocResponse>).data ?? {
      data: null,
      version: null,
    }
  );
};

/**
 * Saves one document. With baseVersion (number, or null for "no document
 * yet") the server only accepts it if nobody saved in between — 409
 * progress_conflict otherwise. Returns the new version.
 */
export const putProgress = async (
  key: ProgressKey,
  data: unknown,
  baseVersion?: number | null,
): Promise<ApiResponse<{ version?: number } | null>> => {
  const res = await axiosInstance.put(
    API_PROGRESS_KEY(key),
    baseVersion === undefined ? { data } : { data, baseVersion },
  );
  return res.data;
};
