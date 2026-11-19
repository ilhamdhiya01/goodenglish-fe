import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { accessErrorText } from "@/const/access.constant";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import type {
  GenerateReadingBody,
  UpdateReadingBody,
  WordMeaning,
} from "@/lib/types/reading.types";
import type { LevelId } from "@/lib/types/session.types";
import {
  deleteReading,
  deleteWordMeaning,
  generateReading,
  getAdminReading,
  getReadingTexts,
  getWordMeanings,
  lookupWord,
  setReadingPublished,
  updateReading,
  updateWordMeaning,
} from "@/services/reading.service";
import { sentenceHash, useReadingStore } from "@/stores/useReadingStore";

export const readingKeys = {
  all: ["reading"] as const,
  texts: (level: string) => [...readingKeys.all, "texts", level] as const,
  lookup: (level: string, word: string, ctx: string) =>
    [...readingKeys.all, "lookup", level, word, ctx] as const,
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
    // One meaning per sentence: the same word elsewhere is looked up again.
    queryKey: readingKeys.lookup(
      level,
      word.toLowerCase(),
      sentenceHash(sentence),
    ),
    queryFn: async () => {
      const r = await lookupWord({ word, level, sentence });
      const { lemma, meaningId, pron } = r.data;
      cacheLookup(level, word, { lemma, meaningId, pron }, sentence);
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
    mutationFn: ({
      id,
      published,
      force,
    }: {
      id: string;
      published: boolean;
      force?: boolean;
    }) => setReadingPublished(id, published, force),
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

/** Admin › Bacaan › Arti kata: meanings saved from learners' taps. */
export const useAdminWordMeanings = (level: LevelId, q: string) => {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: [...readingKeys.all, "meanings", level, q.trim()] as const,
    queryFn: () => getWordMeanings({ level, q }),
    select: (r) => r.data ?? [],
  });
  const refresh = () =>
    void qc.invalidateQueries({
      queryKey: [...readingKeys.all, "meanings"],
    });
  const onError = (e: AxiosError<ErrorResponse>) =>
    toast.error(accessErrorText(e.message));
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<WordMeaning> }) =>
      updateWordMeaning(id, body),
    onSuccess: () => {
      refresh();
      toast.success("Arti kata disimpan");
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteWordMeaning(id),
    onSuccess: () => {
      refresh();
      toast.success("Arti kata dihapus");
    },
    onError,
  });
  return {
    meanings: list.data,
    isLoading: list.isLoading,
    isError: list.isError,
    update: update.mutateAsync,
    isSaving: update.isPending,
    remove: remove.mutateAsync,
  };
};
