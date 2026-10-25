import { useMutation } from "@tanstack/react-query";

import { flushProgress } from "@/lib/helpers/progress-sync.helper";
import { logout } from "@/services/auth.service";

// Saves any queued progress first, then ends this device's session (frees
// its device slot). A full page load to /access drops every cached query and
// store along with it.
export const useLogout = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await flushProgress();
      return logout();
    },
    onSettled: () => {
      // A full load (not router.push) on purpose: it drops every store and
      // cached query that belonged to this session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/access";
    },
  });
  return { handleLogout: mutate, isLoggingOut: isPending };
};
