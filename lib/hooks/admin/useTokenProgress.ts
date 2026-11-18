import { useQuery } from "@tanstack/react-query";

import { getTokenProgress } from "@/services/admin-tokens.service";

import { adminTokenKeys } from "./queryKeys";

// A learner's raw progress docs (admin, read-only "Progres").
export const useTokenProgress = (id: string | null) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: adminTokenKeys.progress(id ?? ""),
    queryFn: () => getTokenProgress(id!),
    select: (r) => r.data,
    enabled: !!id,
  });
  return { progress: data, isLoading, isError };
};
