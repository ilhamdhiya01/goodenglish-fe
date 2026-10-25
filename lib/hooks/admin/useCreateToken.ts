import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { accessErrorText } from "@/const/access.constant";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import { createToken } from "@/services/admin-tokens.service";

import { adminTokenKeys } from "./queryKeys";

export const useCreateToken = () => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: createToken,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminTokenKeys.list() });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(accessErrorText(error.message));
    },
  });
  return { handleCreate: mutateAsync, isCreating: isPending };
};
