import { useQuery } from "@tanstack/react-query";

import { getTokenSummary } from "@/services/admin-tokens.service";

import { adminTokenKeys } from "./queryKeys";

export const useTokenSummary = (id: string | null) => {
  const { data, isLoading } = useQuery({
    queryKey: adminTokenKeys.summary(id ?? ""),
    queryFn: () => getTokenSummary(id!),
    select: (r) => r.data,
    enabled: !!id,
  });
  return { summary: data, isLoading };
};
