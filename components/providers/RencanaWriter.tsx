"use client";

import { useEffect } from "react";

import { useRencana } from "@/lib/rencana/useRencana";
import { usePlanStore } from "@/stores/usePlanStore";

// Writes today's Rencana record into plan.days[today] — { v2: true, s, … },
// the versioned format streak and Progres read — and marks the week passed
// when the weekly checkpoint passes. Only after the activity log has been
// loaded once, so a fresh device never writes "nothing done" over a day
// another device already completed. Renders nothing.
const RencanaWriter = () => {
  const { hari, checkpoint, dimuat, kunci, lulus, T } = useRencana();
  const setDayBlocks = usePlanStore((s) => s.setDayBlocks);
  const setMinggu = usePlanStore((s) => s.setMinggu);

  useEffect(() => {
    if (dimuat) setDayBlocks(hari.flags);
  }, [dimuat, hari.flags, setDayBlocks]);

  useEffect(() => {
    if (dimuat && checkpoint.lulus && lulus === null)
      setMinggu(kunci, { lulus: T });
  }, [dimuat, checkpoint.lulus, lulus, kunci, T, setMinggu]);

  return null;
};

export default RencanaWriter;
