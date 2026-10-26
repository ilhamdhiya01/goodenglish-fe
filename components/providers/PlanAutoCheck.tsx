"use client";

import { useEffect } from "react";

import { AUTO_CHECK } from "@/const/plan.constant";
import { today } from "@/lib/helpers/storage.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import { usePlanStore } from "@/stores/usePlanStore";

// Status blok harian Rencana dihitung dari aktivitas nyata, bukan klik manual,
// dan ditulis ke plan.days[hari ini] supaya streak & perangkat lain melihatnya.
// Dipasang di AppShell (hanya setelah progres server dimuat) supaya hari tetap
// tercatat walau halaman Rencana tidak dibuka.
const PlanAutoCheck = () => {
  const { dueKeys } = useShellData();
  const tally = usePlanStore((s) => s.plan.tally);
  const setDayBlocks = usePlanStore((s) => s.setDayBlocks);

  useEffect(() => {
    const T = today();
    const dow = new Date().getDay();
    const wknd = dow === 0 || dow === 6;
    const t = tally?.day === T ? tally : { day: T };
    const b3 =
      T % 2 === 1 ? (t.ask || 0) >= AUTO_CHECK.ask : (t.pron || 0) >= 1;

    setDayBlocks({
      // Jatuh tempo hanya berkurang lewat ulangan, jadi 0 = semua sudah diulang.
      b1: dueKeys.length === 0,
      b2: !wknd && (t.known || 0) >= AUTO_CHECK.known,
      b3: !wknd && b3,
    });
  }, [dueKeys.length, tally, setDayBlocks]);

  return null;
};

export default PlanAutoCheck;
