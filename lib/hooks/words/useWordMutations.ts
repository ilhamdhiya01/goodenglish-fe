import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { accessErrorText } from "@/const/access.constant";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import type { SharedWordInput } from "@/lib/types/words.types";
import { createWord, deleteWord, updateWord } from "@/services/words.service";

import { wordKeys } from "./queryKeys";

// Admin-only writes to the shared vocabulary. Each one refetches the list,
// which AppShell pushes into useSharedWordsStore.
export const useWordMutations = () => {
  const queryClient = useQueryClient();
  const onError = (error: AxiosError<ErrorResponse>) => {
    toast.error(accessErrorText(error.message));
  };
  const onSuccess = () => {
    void queryClient.invalidateQueries({ queryKey: wordKeys.all });
  };

  const create = useMutation({ mutationFn: createWord, onSuccess, onError });
  const update = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Partial<SharedWordInput>;
    }) => updateWord(id, values),
    onSuccess,
    onError,
  });
  const remove = useMutation({ mutationFn: deleteWord, onSuccess, onError });

  return {
    handleCreate: create.mutateAsync,
    handleUpdate: update.mutateAsync,
    handleDelete: remove.mutateAsync,
    isSaving: create.isPending || update.isPending,
  };
};
