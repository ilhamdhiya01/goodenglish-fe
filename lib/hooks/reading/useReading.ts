import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { accessErrorText } from "@/const/access.constant";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import type {
  GenerateReadingBody,
  UpdateReadingBody,
} from "@/lib/types/reading.types";
import type { LevelId } from "@/lib/types/session.types";
import {
  deleteReading,
  generateReading,
  getAdminReading,
  getReadingTexts,
  lookupWord,
  setReadingPublished,
  updateReading,
} from "@/services/reading.service";
import { useReadingStore } from "@/stores/useReadingStore";

export const readingKeys = {
  all: ["reading"] as const,
  texts: (level: string) => [...readingKeys.all, "texts", level] as const,
  lookup: (level: string, word: string) =>
    [...readingKeys.all, "lookup", level, word] as const,
  admin: (level?: string, week?: number) =>
    [...readingKeys.all, "admin", level ?? "", week ?? 0] as const,
};

/** Published texts of a level (learners). */
export const useReadingTexts = (level: LevelId, enabled = true) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: readingKeys.texts(level),
    queryFn: () => getReadingTexts(level),
    select: (r) => r.data ?? [],
    enabled,
    staleTime: 5 * 60_000,
  });
  return { texts: data, isLoading, isError, refetch };
};

const lookupErrorText = (code: string) =>
  code === "Network Error" ||
  (typeof navigator !== "undefined" && !navigator.onLine)
    ? "Kamu sedang offline. Arti kata ini belum bisa dicari."
    : code === "ai_unavailable" || code === "ai_failed"
      ? "Arti kata ini belum bisa dicari sekarang. Coba lagi sebentar lagi."
      : accessErrorText(code);

/**
 * Meaning of a tapped word from the server (Gemini once, then cached for
 * everyone). Only runs when `enabled`; the answer is also kept locally.
 */
export const useWordLookup = (
  level: LevelId,
  word: string,
  sentence: string,
  enabled: boolean,
) => {
  const cacheLookup = useReadingStore((s) => s.cacheLookup);
  const q = useQuery({
    queryKey: readingKeys.lookup(level, word.toLowerCase()),
    queryFn: async () => {
      const r = await lookupWord({ word, level, sentence });
      const { lemma, meaningId, pron } = r.data;
      cacheLookup(level, word, { lemma, meaningId, pron });
      return r.data;
    },
    enabled: enabled && !!word,
    retry: false,
    staleTime: Infinity,
  });
  const err = q.error as AxiosError<ErrorResponse> | null;
  return {
    result: q.data,
    isLoading: q.isLoading,
    error: err ? lookupErrorText(err.message) : null,
    retry: () => void q.refetch(),
  };
};

/** Admin › Bacaan: list + generate / edit / publish / delete. */
export const useAdminReading = (level?: LevelId, week?: number) => {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: readingKeys.admin(level, week),
    queryFn: () => getAdminReading({ level, week }),
    select: (r) => r.data ?? [],
  });
  // Learner lists too: publishing changes what they see.
  const refresh = () =>
    void qc.invalidateQueries({ queryKey: readingKeys.all });
  const onError = (e: AxiosError<ErrorResponse>) =>
    toast.error(accessErrorText(e.message));

  const generate = useMutation({
    mutationFn: (body: GenerateReadingBody) => generateReading(body),
    onSuccess: (r) => {
      refresh();
      const n = r.data.warnings.length;
      toast.success(
        n
          ? `Draf dibuat dengan ${n} peringatan. Cek dulu sebelum terbit.`
          : "Draf dibuat",
      );
    },
    onError,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateReadingBody }) =>
      updateReading(id, body),
    onSuccess: () => {
      refresh();
      toast.success("Bacaan disimpan");
    },
    onError,
  });
  const publish = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      setReadingPublished(id, published),
    onSuccess: (_r, v) => {
      refresh();
      toast.success(
        v.published ? "Bacaan diterbitkan" : "Bacaan disembunyikan",
      );
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteReading(id),
    onSuccess: () => {
      refresh();
      toast.success("Bacaan dihapus");
    },
    onError,
  });

  return {
    texts: list.data,
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
