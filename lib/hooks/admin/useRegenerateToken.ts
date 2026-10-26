import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { accessErrorText } from "@/const/access.constant";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import { regenerateToken } from "@/services/admin-tokens.service";

import { adminTokenKeys } from "./queryKeys";

// Separate from useTokenAction: the caller needs res.data.token.
export const useRegenerateToken = () => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending, variables } = useMutation({
    mutationFn: regenerateToken,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminTokenKeys.all });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(accessErrorText(error.message));
    },
  });
  return {
    handleRegenerate: mutateAsync,
    isRegenerating: isPending,
    regeneratingId: variables,
  };
};
