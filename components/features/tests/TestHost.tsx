"use client";

import React, { useEffect, useRef } from "react";

import Jalak from "@/components/brand/Jalak";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import { lockScroll } from "@/lib/helpers/scroll-lock.helper";
import { useExamStore } from "@/stores/useExamStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { useTestRunStore } from "@/stores/useTestRunStore";

import ExamFlow from "./ExamFlow";
import PlacementFlow from "./PlacementFlow";

// First visit: offer the placement test, or let the learner pick a level.
const Welcome = () => {
  const open = useTestRunStore((s) => s.open);
  const close = useTestRunStore((s) => s.close);
  return (
    <div className="flex flex-col items-start gap-5">
      <Jalak mood="senang" size={96} />
      <div className="flex flex-col gap-2">
        <PageHeading>Selamat datang di GoodEnglish!</PageHeading>
        <Lead>
          Supaya kamu mulai di level dan minggu yang pas, ikuti tes penempatan
          singkat: 10 soal per level (kosakata, grammar, dan menyimak), ±3 menit
          per level. Siapkan suara (speaker atau earphone).
        </Lead>
      </div>
      <Card className="gap-1 text-sm leading-5 text-ink-2">
        Tes dimulai dari level paling dasar. Kalau jawabanmu ≥ 70% benar, kamu
        lanjut ke 10 soal level berikutnya; kalau tidak, tes selesai. Tes ini
        tidak menandai kata apa pun sebagai hafal.
      </Card>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="green"
          size="lg"
          onClick={() => open({ kind: "placement" })}
        >
          Mulai tes
        </Button>
        <Button
          size="lg"
          onClick={() => {
            useExamStore.getState().setPlacement({
              status: "skipped",
              date: new Date().toISOString(),
            });
            useExamStore
              .getState()
              .setBase(useLevelStore.getState().level as never);
            close();
          }}
        >
          Pilih level sendiri
        </Button>
      </div>
    </div>
  );
};

// Tes penempatan and Ujian akhir level take the whole screen, over the app.
const TestHost = () => {
  const run = useTestRunStore((s) => s.run);
  const close = useTestRunStore((s) => s.close);
  const box = useRef<HTMLDivElement>(null);

  // Lock the page behind (shared lock: the "Keluar?" dialog on top may
  // close after this) and move focus in.
  const isOpen = !!run;
  useEffect(() => {
    if (!isOpen) return;
    const unlock = lockScroll();
    box.current?.focus();
    return unlock;
  }, [isOpen]);

  if (!run) return null;
  return (
    <div
      ref={box}
      role="dialog"
      aria-modal="true"
      aria-label={
        run.kind === "exam"
          ? "Ujian akhir level"
          : run.kind === "placement"
            ? "Tes penempatan"
            : "Selamat datang"
      }
      tabIndex={-1}
      className="fixed inset-0 z-40 overflow-y-auto bg-paper outline-none"
    >
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5 px-4 pt-6 pb-[calc(32px+env(safe-area-inset-bottom))] md:px-8 md:pt-12">
        {run.kind === "welcome" ? (
          <Welcome />
        ) : run.kind === "placement" ? (
          <PlacementFlow onClose={close} />
        ) : (
          <ExamFlow key={run.level} level={run.level} onClose={close} />
        )}
      </div>
    </div>
  );
};

export default TestHost;
