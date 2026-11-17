import { useQuery } from "@tanstack/react-query";

import { getRoleplayUsage } from "@/services/roleplay.service";

export const roleplayKeys = {
  usage: ["roleplay-usage"] as const,
};

/** Sessions used today and the daily limit (null = unlimited). */
export const useRoleplayUsage = (enabled: boolean) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: roleplayKeys.usage,
    queryFn: getRoleplayUsage,
    select: (r) => r.data,
    enabled,
  });
  return { usage: data, isLoading, isError };
};
