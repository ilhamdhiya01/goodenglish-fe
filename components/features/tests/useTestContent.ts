"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import {
  loadBank,
  PRACTICE,
  type PracticeTopic,
} from "@/const/practice-sets.constant";
import {
  bankGen,
  type BankItem,
  type PracticeGen,
} from "@/lib/helpers/bank-practice.helper";
import { listeningKeys } from "@/lib/hooks/listening/useListening";
import type { ListeningItem } from "@/lib/types/listening.types";
import type { LevelId } from "@/lib/types/session.types";
import { getListeningItems } from "@/services/listening.service";
import { useAccessStore } from "@/stores/useAccessStore";

export type Gens = Partial<Record<PracticeTopic, PracticeGen>>;

let cached: Gens | null = null;

/** Every grammar bank (loaded once, ±1 MB of JSON in separate chunks). */
export const useGrammarGens = () => {
  const [gens, setGens] = useState<Gens | null>(cached);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (cached) return;
    let alive = true;
    const topics = Object.keys(PRACTICE) as PracticeTopic[];
    Promise.all(topics.map((t) => loadBank(t)))
      .then((mods) => {
        const g: Gens = {};
        topics.forEach((t, i) => {
          g[t] = bankGen(mods[i].default as BankItem[]);
        });
        cached = g;
        if (alive) setGens(g);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);
  return { gens, error };
};

/** Published "Dengar & jawab" items of a level ([] without the menu or
 * when the server can't be reached: dictation fills in). */
export const useListenItems = () => {
  const qc = useQueryClient();
  const hasMenu = useAccessStore(
    (s) => !!s.session?.menus.includes("listening"),
  );
  return useCallback(
    async (level: LevelId): Promise<ListeningItem[]> => {
      if (!hasMenu) return [];
      try {
        const r = await qc.fetchQuery({
          queryKey: listeningKeys.items(level),
          queryFn: () => getListeningItems(level),
          staleTime: 5 * 60_000,
        });
        return r.data ?? [];
      } catch {
        return [];
      }
    },
    [qc, hasMenu],
  );
};
