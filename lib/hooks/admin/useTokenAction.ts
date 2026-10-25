import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { accessErrorText } from "@/const/access.constant";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import {
  activateToken,
  deleteToken,
  resetTokenSessions,
  revokeToken,
} from "@/services/admin-tokens.service";

import { adminTokenKeys } from "./queryKeys";

export type TokenAction = "revoke" | "activate" | "reset" | "delete";

const RUN: Record<TokenAction, (id: string) => Promise<unknown>> = {
  revoke: revokeToken,
  activate: activateToken,
  reset: resetTokenSessions,
  delete: deleteToken,
};

const DONE: Record<TokenAction, string> = {
  revoke: "Token dinonaktifkan",
  activate: "Token diaktifkan lagi",
  reset: "Semua perangkat dikeluarkan",
  delete: "Token dihapus",
};

export const useTokenAction = () => {
  const queryClient = useQueryClient();
  const { mutate, isPending, variables } = useMutation({
    mutationFn: ({ id, action }: { id: string; action: TokenAction }) =>
      RUN[action](id),
    onSuccess: (_res, { action }) => {
      toast.success(DONE[action]);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(accessErrorText(error.message));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminTokenKeys.all });
    },
  });
  return { handleAction: mutate, isActing: isPending, actingOn: variables };
};
