"use client";

import React from "react";
import { LuX } from "react-icons/lu";

import Jalak from "@/components/brand/Jalak";
import AnswerOption from "@/components/shared/patterns/answer-option";
import Correction from "@/components/shared/patterns/correction";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import IconButton from "@/components/ui/icon-button";
import Modal from "@/components/ui/modal";
import ProgressBar from "@/components/ui/progress-bar";
import SectionLabel from "@/components/ui/section-label";
import { LEVELS } from "@/const/levels.constant";
import { quizPassed } from "@/lib/helpers/quiz-pass.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import { useUnlockedLevels } from "@/lib/hooks/useUnlockedLevels";
import type { LevelId } from "@/lib/types/session.types";
import { useLevelStore } from "@/stores/useLevelStore";
import { useQuizStore } from "@/stores/useQuizStore";

const LETTERS = "ABCDEFGH";
const MSG_GOOD =
  "Bagus. Kamu sudah menguasai sebagian besar kosakata level ini. Silakan lanjut ke level berikutnya kalau mau, atau tetap di sini untuk memperkuat.";
const MSG_GOOD_WEEK =
  "Bagus. Kosakata minggu ini sudah kuat. Lanjut ke minggu berikutnya.";

// "Tes cepat" 20 soal, in a dialog over Kosakata (full screen on a phone)
// while a session is active. The final score is logged to the plan by the
// quiz store.
const QuizPanel = React.memo(() => {
  const { level, week, LV } = useShellData();
  const qz = useQuizStore((s) => s.session);
  const scope = useQuizStore((s) => s.runScope);
  const pick = useQuizStore((s) => s.pick);
  const next = useQuizStore((s) => s.next);
  const restart = useQuizStore((s) => s.restart);
  const close = useQuizStore((s) => s.close);
  const setLevel = useLevelStore((s) => s.setLevel);

  // "Wajib lulus ujian" (or a level the token doesn't allow): no shortcut.
  const unlocked = useUnlockedLevels();

  if (!qz) return null;
  const after = LEVELS[LEVELS.findIndex((l) => l[0] === level) + 1];
  // Moving up is offered after a test over the whole level only.
  const up =
    scope === "all" && after && unlocked.includes(after[0] as LevelId)
      ? after
      : undefined;
  const total = qz.qs.length;
  const passed = quizPassed(qz.score, total);
  const fair = qz.score >= Math.ceil(0.6 * total);
  const cur = qz.qs[qz.i];
  const picked = qz.picked !== null;
  const last = qz.i === qz.qs.length - 1;
  const n = qz.done ? qz.qs.length : qz.i + 1;

  return (
    <Modal label="Tes cepat" size="lg" onClose={close}>
      <Card pad="lg" className="gap-5">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <SectionLabel tone="green">
              Tes cepat · {LV[1]} ·{" "}
              {scope === "week"
                ? "Minggu " + String(week).padStart(2, "0")
                : "Semua minggu"}
            </SectionLabel>
            <span className="text-base font-extrabold text-ink">
              Soal {n} / {qz.qs.length}
            </span>
          </div>
          <IconButton aria-label="Tutup" title="Tutup" onClick={close}>
            <LuX aria-hidden size={18} />
          </IconButton>
        </div>
        <ProgressBar
          pct={(n / qz.qs.length) * 100}
          name={`Soal ${n} dari ${qz.qs.length}`}
        />

        {!qz.done && cur && (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13.5px] font-bold text-ink-2">
                {cur.prompt}
              </span>
              <span className="text-[34px] leading-10 font-black tracking-[-0.01em] text-ink md:text-[44px] md:leading-12">
                {cur.word}
              </span>
              <span className="text-[15px] leading-[22px] text-ink-2 italic">
                {cur.ex}
              </span>
            </div>
            <div className="grid gap-2.5 md:grid-cols-2">
              {cur.opts.map((o, i) => (
                <AnswerOption
                  key={o}
                  letter={LETTERS[i]}
                  data-testid="quiz-option"
                  disabled={picked}
                  onClick={() => pick(o)}
                  state={
                    !picked
                      ? "idle"
                      : o === cur.ans
                        ? "correct"
                        : o === qz.picked
                          ? "wrong"
                          : "dimmed"
                  }
                >
                  {o}
                </AnswerOption>
              ))}
            </div>
            {picked && (
              // Stays in reach on a phone, under the options.
              <div className="sticky bottom-0 -mx-[18px] -mb-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-line bg-surface px-[18px] py-3 md:static md:mx-0 md:mb-0 md:border-0 md:p-0">
                <span
                  role="status"
                  className={
                    qz.picked === cur.ans
                      ? "text-sm font-extrabold text-ok"
                      : "text-sm font-extrabold text-bad"
                  }
                >
                  {qz.picked === cur.ans
                    ? "✓ Benar!"
                    : "✕ Kurang tepat. Jawabannya: " + cur.ans}
                </span>
                <Button variant="green" onClick={next} autoFocus>
                  {last ? "Lihat hasil" : "Soal berikutnya"}
                </Button>
              </div>
            )}
          </>
        )}

        {qz.done && (
          <div className="flex flex-col gap-4">
            <Jalak mood={passed ? "senang" : "biasa"} size={96} />
            <span className="text-[44px] leading-12 font-black tracking-[-0.02em] text-ink">
              {qz.score} / {qz.qs.length}
            </span>
            {!(passed && up) && (
              <span className="text-[15px] leading-[22px] text-ink-2">
                {passed
                  ? scope === "all"
                    ? MSG_GOOD
                    : MSG_GOOD_WEEK
                  : fair
                    ? "Cukup baik. Ulangi minggu yang masih banyak belum hafal, lalu tes lagi."
                    : "Belum stabil. Lanjutkan minggu demi minggu, pakai mode tes untuk latihan, dan coba lagi nanti."}
              </span>
            )}
            {!!qz.misses?.length && (
              <Card tone="done" className="gap-3">
                <SectionLabel>Yang salah</SectionLabel>
                {qz.misses.map((m) => (
                  <Correction
                    key={m.word}
                    wrong={`${m.word} = ${m.picked}`}
                    right={`${m.word} = ${m.ans}`}
                  />
                ))}
              </Card>
            )}
            {passed && up ? (
              <Card tone="greenBg" className="gap-3">
                <span className="text-[15px] leading-[22px] font-bold text-ink">
                  ✓ {MSG_GOOD}
                </span>
                <div className="flex flex-wrap gap-2.5">
                  <Button variant="outline" onClick={restart}>
                    Ulangi tes
                  </Button>
                  <Button variant="green" onClick={() => setLevel(up[0])}>
                    Pindah ke {up[1]}
                  </Button>
                </div>
              </Card>
            ) : (
              <Button
                variant="outline"
                className="self-start"
                onClick={restart}
              >
                Ulangi tes
              </Button>
            )}
          </div>
        )}
      </Card>
    </Modal>
  );
});

QuizPanel.displayName = "QuizPanel";

export default QuizPanel;
