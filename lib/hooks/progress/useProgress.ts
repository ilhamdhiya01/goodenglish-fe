import { useQuery } from "@tanstack/react-query";

import { getProgress } from "@/services/progress.service";

import { progressKeys } from "./queryKeys";

// Fetched once per page load to seed the stores. After that the stores are
// the working copy and changes are written back by progress-sync.helper, so
// this query never refetches on its own.
export const useProgress = (enabled: boolean) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: progressKeys.all,
    queryFn: getProgress,
    select: (r) => r.data ?? {},
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });
  return { progress: data, isLoading, isError };
};
