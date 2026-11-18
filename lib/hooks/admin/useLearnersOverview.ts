import { useQuery } from "@tanstack/react-query";

import { getLearnersOverview } from "@/services/admin-tokens.service";

import { adminTokenKeys } from "./queryKeys";

export const useLearnersOverview = () => {
  const { data, dataUpdatedAt, isLoading, isError, refetch } = useQuery({
    queryKey: adminTokenKeys.learners(),
    queryFn: getLearnersOverview,
    select: (r) => r.data,
  });
  // dataUpdatedAt: "now" for the idle days, fixed per load.
  return {
    learners: data,
    loadedAt: dataUpdatedAt,
    isLoading,
    isError,
    refetch,
  };
};
