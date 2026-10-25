"use client";

import classNames from "classnames";
import React from "react";

import Button from "@/components/ui/button";
import TextButton from "@/components/ui/text-button";
import { LEVELS } from "@/const/levels.constant";
import { useShellData } from "@/lib/hooks/useShellData";
import { useLevelStore } from "@/stores/useLevelStore";
import { useQuizStore } from "@/stores/useQuizStore";

// Panel "Tes cepat" 20 soal — hidup di atas halaman Kosakata saat sesi aktif.
// Skor akhir otomatis dicatat ke rencana oleh quiz store.
const QuizPanel = React.memo(() => {
  const { level, week, LV } = useShellData();
  const qz = useQuizStore((s) => s.session);
  const scope = useQuizStore((s) => s.scope);
  const pick = useQuizStore((s) => s.pick);
  const next = useQuizStore((s) => s.next);
  const restart = useQuizStore((s) => s.restart);
  const close = useQuizStore((s) => s.close);
  const setLevel = useLevelStore((s) => s.setLevel);

  if (!qz) return null;
  const up = LEVELS[LEVELS.findIndex((l) => l[0] === level) + 1];
  const cur = qz.qs[qz.i];
  const picked = qz.picked !== null;
  const last = qz.i === qz.qs.length - 1;

  return (
    <section className="flex max-w-[760px] flex-col gap-4.5 rounded-xl border-[1.5px] border-ink bg-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="font-mono text-xs tracking-[0.06em] text-green">
          TES CEPAT · {LV[1].toUpperCase()} ·{" "}
          {scope === "week"
            ? "MINGGU " + String(week).padStart(2, "0")
            : "SEMUA MINGGU"}{" "}
          · SOAL {qz.done ? qz.qs.length : qz.i + 1} / {qz.qs.length}
        </span>
        <TextButton onClick={close}>Tutup</TextButton>
      </div>

      {!qz.done && cur && (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] text-muted">{cur.prompt}</span>
            <span className="text-[32px] font-bold tracking-[-0.01em]">
              {cur.word}
            </span>
            <span className="font-serif text-[17px] text-ink-3 italic">
              {cur.ex}
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-2.5">
            {cur.opts.map((o) => {
              const right = o === cur.ans;
              const chosen = o === qz.picked;
              return (
                <button
                  type="button"
                  key={o}
                  onClick={() => pick(o)}
                  className={classNames(
                    "cursor-pointer rounded-lg border-[1.5px] px-4 py-3.5 text-left font-sans text-[15px] text-ink transition-colors hover:border-ink",
                    picked && right
                      ? "border-green bg-green-bg2"
                      : picked && chosen
                        ? "border-red bg-red-bg"
                        : "border-line-2 bg-card",
                  )}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {picked && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={classNames(
                  "text-sm font-semibold",
                  qz.picked === cur.ans ? "text-green" : "text-red",
                )}
              >
                {qz.picked === cur.ans
                  ? "Benar!"
                  : "Kurang tepat. Jawabannya: " + cur.ans}
              </span>
              <Button variant="dark" onClick={next}>
                {last ? "Lihat hasil" : "Soal berikutnya"}
              </Button>
            </div>
          )}
        </>
      )}

      {qz.done && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[40px] font-bold tracking-[-0.02em]">
            {qz.score} / {qz.qs.length}
          </span>
          <span className="text-[15px] leading-[1.55] text-ink-2">
            {qz.score >= 16
              ? "Bagus. Kamu sudah menguasai sebagian besar kosakata level ini. Silakan lanjut ke level berikutnya kalau mau, atau tetap di sini untuk memperkuat."
              : qz.score >= 12
                ? "Cukup baik. Ulangi minggu yang masih banyak belum hafal, lalu tes lagi."
                : "Belum stabil. Lanjutkan minggu demi minggu, pakai mode tes untuk latihan, dan coba lagi nanti."}
          </span>
          <div className="mt-1.5 flex flex-wrap gap-2.5">
            <Button variant="outline" onClick={restart}>
              Ulangi tes
            </Button>
            {qz.score >= 16 && up && (
              <Button variant="green" onClick={() => setLevel(up[0])}>
                Pindah ke {up[1]}
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
});

QuizPanel.displayName = "QuizPanel";

export default QuizPanel;
