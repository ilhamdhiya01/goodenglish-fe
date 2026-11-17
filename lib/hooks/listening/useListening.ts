import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { accessErrorText } from "@/const/access.constant";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import type {
  GenerateListeningBody,
  UpdateListeningBody,
} from "@/lib/types/listening.types";
import type { LevelId } from "@/lib/types/session.types";
import {
  deleteListening,
  generateListening,
  getAdminListening,
  getListeningItems,
  setListeningPublished,
  updateListening,
} from "@/services/listening.service";

export const listeningKeys = {
  all: ["listening"] as const,
  items: (level: string) => [...listeningKeys.all, "items", level] as const,
  admin: (level?: string, week?: number) =>
    [...listeningKeys.all, "admin", level ?? "", week ?? 0] as const,
};

/** Published "Dengar & jawab" items of a level (learners). */
export const useListeningItems = (level: LevelId, enabled = true) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: listeningKeys.items(level),
    queryFn: () => getListeningItems(level),
    select: (r) => r.data ?? [],
    enabled,
    staleTime: 5 * 60_000,
  });
  return { items: data, isLoading, isError, refetch };
};

/** Admin › Menyimak: list + generate / edit / publish / delete. */
export const useAdminListening = (level?: LevelId, week?: number) => {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: listeningKeys.admin(level, week),
    queryFn: () => getAdminListening({ level, week }),
    select: (r) => r.data ?? [],
  });
  // Learner lists too: publishing changes what they see.
  const refresh = () =>
    void qc.invalidateQueries({ queryKey: listeningKeys.all });
  const onError = (e: AxiosError<ErrorResponse>) =>
    toast.error(accessErrorText(e.message));

  const generate = useMutation({
    mutationFn: (body: GenerateListeningBody) => generateListening(body),
    onSuccess: (r) => {
      refresh();
      const { items, failed } = r.data;
      toast.success(
        `${items.length} draf dibuat` +
          (failed ? `, ${failed} gagal (coba generate lagi)` : ""),
      );
    },
    onError,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateListeningBody }) =>
      updateListening(id, body),
    onSuccess: () => {
      refresh();
      toast.success("Soal disimpan");
    },
    onError,
  });
  const publish = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      setListeningPublished(id, published),
    onSuccess: (_r, v) => {
      refresh();
      toast.success(v.published ? "Soal diterbitkan" : "Soal ditarik ke draf");
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteListening(id),
    onSuccess: () => {
      refresh();
      toast.success("Soal dihapus");
    },
    onError,
  });

  return {
    items: list.data,
    isLoading: list.isLoading,
    isError: list.isError,
    generate: generate.mutateAsync,
    isGenerating: generate.isPending,
    update: update.mutateAsync,
    isSaving: update.isPending,
    setPublished: publish.mutateAsync,
    remove: remove.mutateAsync,
    busyId:
      (publish.isPending && publish.variables?.id) ||
      (remove.isPending && remove.variables) ||
      null,
  };
};
