import { useQuery } from "@tanstack/react-query";

import { getSession } from "@/services/auth.service";

import { authKeys } from "./queryKeys";

// The device session behind the `session` cookie (label, role, allowed menus
// and levels). 401 means "no valid session" — AppShell sends the user to
// /access, so there's nothing to retry.
export const useSession = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: authKeys.session(),
    queryFn: getSession,
    select: (r) => r.data,
    staleTime: Infinity,
    retry: false,
  });
  return { session: data, isLoading, isError, error };
};
