import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { accessErrorText } from "@/const/access.constant";
import { toast } from "@/lib/toast";
import type { AccessTokenItem, TokenFormValues } from "@/lib/types/admin.types";
import type { ErrorResponse } from "@/lib/types/api.types";
import { updateToken } from "@/services/admin-tokens.service";

import { adminTokenKeys } from "./queryKeys";

// Optimistic: the edited row updates immediately and rolls back on error.
export const useUpdateToken = () => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Partial<TokenFormValues>;
    }) => updateToken(id, values),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: adminTokenKeys.list() });
      const previous = queryClient.getQueryData(adminTokenKeys.list());
      queryClient.setQueryData(
        adminTokenKeys.list(),
        (old: { data: AccessTokenItem[] } | undefined) =>
          old && {
            ...old,
            data: old.data.map((t) => (t.id === id ? { ...t, ...values } : t)),
          },
      );
      return { previous };
    },
    onError: (error: AxiosError<ErrorResponse>, _vars, ctx) => {
      queryClient.setQueryData(adminTokenKeys.list(), ctx?.previous);
      toast.error(accessErrorText(error.message));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminTokenKeys.list() });
    },
  });
  return { handleUpdate: mutateAsync, isUpdating: isPending };
};
