"use client";

import classNames from "classnames";
import React, { useState } from "react";

import AnswerOption from "@/components/shared/patterns/answer-option";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import {
  ERROR_GROUP_CATEGORY,
  ERROR_GROUP_RULE,
  FALLBACK_CATEGORY,
} from "@/const/mistake-categories.constant";
import { PILOT } from "@/const/pilot.constant";
import { VOCAB_ERRORS } from "@/lib/content";
import { buildReviewQuiz, type QuizQ } from "@/lib/helpers/review-quiz.helper";
import { speak } from "@/lib/helpers/speech.helper";
import { laporAktivitas } from "@/lib/rencana/lapor";
import type { ErrorGroup } from "@/lib/types/scenario.types";
import type { LevelId } from "@/lib/types/session.types";
import { useLevelStore } from "@/stores/useLevelStore";
import { addMistake, useMistakeStore } from "@/stores/useMistakeStore";
import { usePlanStore } from "@/stores/usePlanStore";

// Blok Ulang on a day with nothing due: 5 "mana yang benar" questions from
// Buku kesalahanku (or Kesalahan umum when it's empty). Finishing them ticks
// the block; opening the app alone never does.
const ReviewQuiz = ({ onDone }: { onDone?: () => void }) => {
  const level = useLevelStore((s) => s.level);
  const [qs] = useState<QuizQ[]>(() =>
    buildReviewQuiz(
      useMistakeStore.getState().items,
      VOCAB_ERRORS as ErrorGroup[],
      level,
      PILOT.b1QuizSize,
    ),
  );
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [done, setDone] = useState(false);
  const q = qs[i];

  if (!qs.length) return null;

  if (done)
    return (
      <Card tone="greenBg" className="gap-1.5">
        <span role="status" className="text-[15px] font-extrabold text-ink">
          ✓ Kuis selesai: {right}/{qs.length} benar. Blok Ulang hari ini
          tercentang.
        </span>
      </Card>
    );

  const choose = (o: string) => {
    if (picked) return;
    setPicked(o);
    const ok = o === q.right;
    if (ok) {
      setRight((n) => n + 1);
      speak(q.right);
    } else if (q.cat) {
      // Catalogue items become the learner's own mistakes, like Kesalahan umum.
      addMistake({
        source: "Kuis Kesalahan umum",
        wrong: o,
        correct: q.right,
        explanation_id: q.why,
        category: ERROR_GROUP_CATEGORY[q.cat] ?? FALLBACK_CATEGORY,
        rule: ERROR_GROUP_RULE[q.cat],
        level: level as LevelId,
        refId: q.cat,
      });
    }
  };
  const next = () => {
    if (i + 1 >= qs.length) {
      usePlanStore.getState().markQuizDone();
      laporAktivitas("kuis_kesalahan_selesai", {
        skor: right,
        total: qs.length,
        data: {},
      });
      setDone(true);
      onDone?.();
      return;
    }
    setI(i + 1);
    setPicked(null);
  };

  return (
    <Card className="gap-3">
      <SectionLabel>
        KUIS PENGGANTI ULANG · SOAL {i + 1} DARI {qs.length}
      </SectionLabel>
      <span className="text-[15px] leading-[22px] font-bold text-ink">
        Mana kalimat yang benar?
      </span>
      <div className="flex flex-col gap-2.5">
        {q.opts.map((o, k) => (
          <AnswerOption
            key={o}
            letter={String.fromCharCode(65 + k)}
            onClick={() => choose(o)}
            disabled={!!picked}
            state={
              !picked
                ? "idle"
                : o === q.right
                  ? "correct"
                  : o === picked
                    ? "wrong"
                    : "dimmed"
            }
          >
            {o}
          </AnswerOption>
        ))}
      </div>
      {picked && (
        <div className="flex flex-col gap-2.5 border-t-2 border-dashed border-line pt-3.5">
          <span
            role="status"
            className={classNames(
              "flex items-center gap-2 text-[15px] font-extrabold",
              picked === q.right ? "text-ok" : "text-bad",
            )}
          >
            {picked === q.right ? "✓ Benar." : "✕ Yang benar: " + q.right}
            <SpeakButton size={28} icon={13} text={q.right} />
          </span>
          {!!q.why && (
            <span className="text-sm leading-5 text-ink-2">{q.why}</span>
          )}
          <Button variant="green" className="self-start" onClick={next}>
            {i + 1 >= qs.length ? "Selesai" : "Soal berikutnya →"}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ReviewQuiz;
