"use client";

import { useEffect } from "react";

import { dayBlocks } from "@/lib/helpers/plan-check.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import { useToday } from "@/lib/hooks/useToday";
import { usePlanStore } from "@/stores/usePlanStore";

// Status blok harian Rencana dihitung dari aktivitas nyata, bukan klik manual,
// dan ditulis ke plan.days[hari ini] supaya streak & perangkat lain melihatnya.
// Aturannya ada di lib/helpers/plan-check.helper.ts. Dipasang di AppShell
// (hanya setelah progres server dimuat) supaya hari tetap tercatat walau
// halaman Rencana tidak dibuka. Dihitung ulang saat hari berganti.
const PlanAutoCheck = () => {
  const { dueKeys, dueMistakes } = useShellData();
  const due = dueKeys.length + dueMistakes.length;
  const tally = usePlanStore((s) => s.plan.tally);
  const setDayBlocks = usePlanStore((s) => s.setDayBlocks);
  const T = useToday();

  useEffect(() => {
    setDayBlocks(dayBlocks({ T, due, tally }));
  }, [T, due, tally, setDayBlocks]);

  return null;
};

export default PlanAutoCheck;
