import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { type Durasi, RENCANA, TOPIK_BAWAAN } from "@/const/rencana.config";
import { VOCAB_SCEN } from "@/lib/content";
import { streakOf } from "@/lib/helpers/streak.helper";
import { useToday } from "@/lib/hooks/useToday";
import {
  evaluasiCheckpoint,
  evaluasiHari,
  type KonteksMinggu,
} from "@/lib/rencana/evaluasi";
import type { Scenario } from "@/lib/types/scenario.types";
import type { LevelId, MenuId } from "@/lib/types/session.types";
import { getPetaMinggu } from "@/services/rencana.service";
import { getRoleplayUsage } from "@/services/roleplay.service";
import { useAccessStore } from "@/stores/useAccessStore";
import { useLaporanStore } from "@/stores/useLaporanStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { usePlanStore } from "@/stores/usePlanStore";

const SC = VOCAB_SCEN as Scenario[];
const NO_MENUS: MenuId[] = [];

/** Scenario of a week without an admin map: the level's in turn. */
export const skenarioBergilir = (level: string, week: number) => {
  const list = SC.filter((s) => s.level === level);
  if (!list.length) return SC[0]?.id ?? "";
  return list[(Math.max(1, week) - 1) % list.length].id;
};

export const rencanaKeys = {
  peta: (level: string) => ["rencana", "minggu", level] as const,
  usage: ["rencana", "roleplay-usage"] as const,
};

/**
 * Everything Rencana shows: the day's steps, streak and the weekly
 * checkpoint, from the activity log plus the active level/week, the token's
 * menus, the chosen duration and the admin week map.
 */
export const useRencana = () => {
  const T = useToday();
  const laporan = useLaporanStore((s) => s.items);
  const dimuat = useLaporanStore((s) => s.dimuat);
  const menus = useAccessStore((s) => s.session?.menus) ?? NO_MENUS;
  const level = useLevelStore((s) => s.level) as LevelId;
  const minggu = useLevelStore((s) => s.week);
  const plan = usePlanStore((s) => s.plan);
  const durasi: Durasi = plan.durasi ?? RENCANA.durasiBawaan;
  const kunci = `${level}|${minggu}`;
  const mulai = plan.week?.[kunci]?.mulai ?? null;

  const peta = useQuery({
    queryKey: rencanaKeys.peta(level),
    queryFn: () => getPetaMinggu(level),
    select: (r) => r.data ?? [],
    staleTime: 5 * 60_000,
  });
  const baris = peta.data?.find((p) => p.week === minggu);
  const k: KonteksMinggu = {
    level,
    minggu,
    topik: baris?.grammarTopic || TOPIK_BAWAAN,
    skenario: baris?.scenarioId || skenarioBergilir(level, minggu),
  };

  const punyaMainPeran = menus.includes("roleplay");
  const usage = useQuery({
    queryKey: rencanaKeys.usage,
    queryFn: getRoleplayUsage,
    select: (r) => r.data,
    enabled: punyaMainPeran,
    staleTime: 60_000,
  });
  const u = usage.data;
  // A session done today keeps the step as it was, even if it used the
  // last of the quota.
  const sudahMainPeran = laporan.some(
    (l) => l.day === T && l.jenis === "main_peran_selesai",
  );
  const mainPeranTersedia =
    punyaMainPeran &&
    (sudahMainPeran || !u || u.limit === null || u.used < u.limit);

  const hari = useMemo(
    () =>
      evaluasiHari({
        ...k,
        laporan,
        T,
        menus,
        durasi,
        mainPeranTersedia,
      }),
    // k's fields are listed one by one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      laporan,
      T,
      menus,
      durasi,
      mainPeranTersedia,
      k.level,
      k.minggu,
      k.topik,
      k.skenario,
    ],
  );
  const checkpoint = useMemo(
    () => evaluasiCheckpoint({ ...k, laporan, T, menus, mulai }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [laporan, T, menus, mulai, k.level, k.minggu, k.topik, k.skenario],
  );
  const streak = useMemo(() => streakOf(plan.days, T), [plan.days, T]);

  return {
    T,
    hari,
    checkpoint,
    streak,
    durasi,
    minggu: k,
    kunci,
    lulus: plan.week?.[kunci]?.lulus ?? null,
    dimuat,
  };
};
