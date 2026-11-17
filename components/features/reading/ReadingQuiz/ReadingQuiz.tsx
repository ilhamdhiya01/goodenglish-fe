"use client";

import React, { useState } from "react";

import AnswerOption from "@/components/shared/patterns/answer-option";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import SectionLabel from "@/components/ui/section-label";
import { type Answer, isCorrect } from "@/lib/helpers/reading.helper";
import type { ReadingQuestion } from "@/lib/types/reading.types";

const LETTERS = ["A", "B", "C", "D"];
const PICKED = "border-accent-line! bg-accent-tint! text-accent-edge!";

interface ReadingQuizProps {
  questions: ReadingQuestion[];
  /** Called once, when the answers are checked. */
  onChecked: (score: number) => void;
}

const optionState = (checked: boolean, right: boolean, picked: boolean) =>
  !checked ? "idle" : right ? "correct" : picked ? "wrong" : "dimmed";

// The 5 comprehension questions (3 pilihan ganda, 1 benar/salah, 1 temukan
// kata). Answers are checked together, then each shows its explanation.
const ReadingQuiz = ({ questions, onChecked }: ReadingQuizProps) => {
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [checked, setChecked] = useState(false);
  const set = (i: number, a: Answer) => setAnswers((x) => ({ ...x, [i]: a }));
  const answered = (i: number) => {
    const a = answers[i];
    return typeof a === "string"
      ? a.trim() !== ""
      : a !== undefined && a !== null;
  };
  const all = questions.every((_, i) => answered(i));

  const check = () => {
    setChecked(true);
    onChecked(
      questions.filter((q, i) => isCorrect(q, answers[i] ?? null)).length,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionLabel tone="green">
        SOAL PEMAHAMAN · {questions.length} SOAL
      </SectionLabel>
      <ol className="m-0 flex list-none flex-col gap-5 p-0">
        {questions.map((q, qi) => {
          const a = answers[qi] ?? null;
          const ok = checked && isCorrect(q, a);
          return (
            <li key={qi} className="flex flex-col gap-2">
              <span className="text-[15px] leading-[21px] font-extrabold text-ink">
                {qi + 1}.{" "}
                {q.type === "mcq"
                  ? q.question
                  : q.type === "true_false"
                    ? `Benar atau salah: "${q.statement}"`
                    : q.promptId}
              </span>

              {q.type === "mcq" && (
                <div className="grid gap-2 md:grid-cols-2">
                  {q.options.map((o, oi) => (
                    <AnswerOption
                      key={oi}
                      letter={LETTERS[oi]}
                      state={optionState(
                        checked,
                        oi === q.answerIndex,
                        a === oi,
                      )}
                      aria-pressed={a === oi}
                      disabled={checked}
                      className={!checked && a === oi ? PICKED : undefined}
                      onClick={() => set(qi, oi)}
                    >
                      {o}
                    </AnswerOption>
                  ))}
                </div>
              )}

              {q.type === "true_false" && (
                <div className="grid grid-cols-2 gap-2 md:max-w-[420px]">
                  {[true, false].map((v, vi) => (
                    <AnswerOption
                      key={vi}
                      letter={v ? "B" : "S"}
                      state={optionState(checked, v === q.answer, a === v)}
                      aria-pressed={a === v}
                      disabled={checked}
                      className={!checked && a === v ? PICKED : undefined}
                      onClick={() => set(qi, v)}
                    >
                      {v ? "Benar" : "Salah"}
                    </AnswerOption>
                  ))}
                </div>
              )}

              {q.type === "find_word" && (
                <Input
                  value={typeof a === "string" ? a : ""}
                  onChange={(e) => set(qi, e.target.value)}
                  disabled={checked}
                  aria-label={`Jawaban soal ${qi + 1}`}
                  placeholder="Ketik katanya dari teks"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="md:max-w-[420px]"
                />
              )}

              {checked && (
                <span
                  className={
                    "text-[13.5px] leading-[19px] font-semibold " +
                    (ok ? "text-ink-2" : "text-ink")
                  }
                >
                  <span
                    className={
                      ok ? "font-extrabold text-ok" : "font-extrabold text-bad"
                    }
                  >
                    {ok ? "✓ Benar. " : "✕ Kurang tepat. "}
                  </span>
                  {q.type === "find_word"
                    ? `Jawabannya: "${q.answer}".`
                    : q.explanationId}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {!checked && (
        <Button
          variant="green"
          className="self-start"
          disabled={!all}
          onClick={check}
        >
          Periksa jawaban
        </Button>
      )}
    </div>
  );
};

export default ReadingQuiz;
