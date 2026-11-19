import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { shouldRetry } from "@/components/providers/QueryProvider";
import { getSession } from "@/services/auth.service";

import { authKeys } from "./queryKeys";

// The device session behind the `session` cookie (label, role, allowed menus
// and levels). Only a 401 means "no valid session" (the shells send the user
// to /access); a network or server error is retried, then shown as "Tidak
// bisa terhubung" with a retry button — the learner stays signed in.
export const useSession = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: authKeys.session(),
    queryFn: getSession,
    select: (r) => r.data,
    staleTime: Infinity,
    retry: shouldRetry,
  });
  const isUnauthorized =
    isError && isAxiosError(error) && error.response?.status === 401;
  return {
    session: data,
    isLoading,
    isError,
    isUnauthorized,
    error,
    refetch,
    isFetching,
  };
};
