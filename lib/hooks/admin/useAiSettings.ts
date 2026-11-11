import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { accessErrorText } from "@/const/access.constant";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import {
  getAiModels,
  getAiSettings,
  previewAiModels,
  removeAiKey,
  saveAiSettings,
} from "@/services/ai-settings.service";

export const aiSettingsKeys = {
  all: ["admin-ai-settings"] as const,
  settings: () => [...aiSettingsKeys.all, "settings"] as const,
  models: () => [...aiSettingsKeys.all, "models"] as const,
};

// Admin › Tanya AI: the stored Gemini key (masked) and model, the model list
// for the stored key, and the writes.
export const useAiSettings = () => {
  const queryClient = useQueryClient();
  const onError = (error: AxiosError<ErrorResponse>) => {
    toast.error(accessErrorText(error.message));
  };
  // A new key or model changes both the summary and the model list.
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: aiSettingsKeys.all });

  const settings = useQuery({
    queryKey: aiSettingsKeys.settings(),
    queryFn: getAiSettings,
    select: (r) => r.data,
  });
  const models = useQuery({
    queryKey: aiSettingsKeys.models(),
    queryFn: getAiModels,
    select: (r) => r.data,
    staleTime: 60 * 60 * 1000,
  });

  const save = useMutation({
    mutationFn: saveAiSettings,
    onSuccess: () => {
      toast.success("Pengaturan Tanya AI tersimpan");
      void refresh();
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: removeAiKey,
    onSuccess: () => {
      toast.success("API key dihapus. Tanya AI nonaktif.");
      void refresh();
    },
    onError,
  });
  // Errors are shown inline by the form (a bad key is the common case).
  const preview = useMutation({ mutationFn: previewAiModels });

  return {
    settings: settings.data,
    isLoading: settings.isLoading,
    isError: settings.isError,
    models: models.data,
    isLoadingModels: models.isFetching,
    handleSave: save.mutateAsync,
    isSaving: save.isPending,
    handleRemoveKey: remove.mutateAsync,
    isRemoving: remove.isPending,
    handlePreview: preview.mutateAsync,
    isPreviewing: preview.isPending,
  };
};
