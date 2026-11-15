"use client";

import React from "react";

import Button from "@/components/ui/button";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import { useShellData } from "@/lib/hooks/useShellData";
import { useQuizStore } from "@/stores/useQuizStore";

// "Tes cepat" launcher on the Kosakata page (moved out of the old tab row):
// pick this week or every week, then start a 20-question test.
const QuickTestBar = React.memo(() => {
  const { all, week } = useShellData();
  const scope = useQuizStore((s) => s.scope);
  const setScope = useQuizStore((s) => s.setScope);
  const startQuiz = useQuizStore((s) => s.start);

  const start = () => {
    const src = scope === "week" ? all.filter((x) => x.w === week) : all;
    startQuiz(src.length >= 8 ? src : all);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SectionLabel>TES CEPAT</SectionLabel>
      <Pill
        size="sm"
        on={scope === "week"}
        title="Soal hanya dari minggu yang sedang dibuka"
        onClick={() => setScope("week")}
      >
        Minggu ini
      </Pill>
      <Pill
        size="sm"
        on={scope === "all"}
        title="Soal dari semua minggu di level ini"
        onClick={() => setScope("all")}
      >
        Semua
      </Pill>
      <Button variant="green" size="sm" onClick={start}>
        {scope === "week"
          ? `Tes minggu ${week} · 20 soal`
          : "Tes semua minggu · 20 soal"}
      </Button>
    </div>
  );
});

QuickTestBar.displayName = "QuickTestBar";

export default QuickTestBar;
