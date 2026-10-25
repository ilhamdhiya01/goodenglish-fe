import { useQuery } from "@tanstack/react-query";

import { getTokens } from "@/services/admin-tokens.service";

import { adminTokenKeys } from "./queryKeys";

export const useTokenList = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: adminTokenKeys.list(),
    queryFn: getTokens,
    select: (r) => r.data ?? [],
  });
  return { tokens: data ?? [], isLoading, isError };
};
