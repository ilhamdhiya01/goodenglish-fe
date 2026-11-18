"use client";

import React, { useEffect, useRef, useState } from "react";
import { LuX } from "react-icons/lu";

import Button from "@/components/ui/button";
import IconButton from "@/components/ui/icon-button";
import ProgressBar from "@/components/ui/progress-bar";
import SectionLabel from "@/components/ui/section-label";
import { stopSpeaking } from "@/lib/helpers/speech.helper";
import {
  SECTION_LABEL,
  type TestAnswer,
  type TestQuestion,
} from "@/lib/types/exam.types";
import { confirmDialog } from "@/stores/useConfirmStore";

import QuestionView, { orderText } from "./QuestionView";
import type { Gens } from "./useTestContent";

interface Props {
  title: string;
  questions: TestQuestion[];
  gens: Gens;
  onDone: (answers: TestAnswer[]) => void;
  onQuit: () => void;
}

/** What gets graded: "Susun kata" tile ids become the sentence. */
const finalAnswer = (q: TestQuestion, v: TestAnswer): TestAnswer =>
  q.kind === "grammar" && q.stage === "order" ? orderText(q.q.shuffled, v) : v;

// One question per screen with a progress bar; no feedback until the end.
const TestRunner = ({ title, questions, gens, onDone, onQuit }: Props) => {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<TestAnswer[]>([]);
  const [value, setValue] = useState<TestAnswer>(null);
  const top = useRef<HTMLDivElement>(null);
  const q = questions[i];
  // Placement counts per level (each level is its own batch of 10).
  const count = questions.length;
  const filled =
    value !== null && !(typeof value === "string" && !value.trim());

  useEffect(() => () => stopSpeaking(), []);

  const next = () => {
    if (!filled) return;
    stopSpeaking();
    const all = [...answers, finalAnswer(q, value)];
    if (i + 1 >= questions.length) {
      onDone(all);
      return;
    }
    setAnswers(all);
    setValue(null);
    setI(i + 1);
    top.current?.scrollIntoView({ block: "start" });
  };

  const quit = async () => {
    const ok = await confirmDialog({
      title: "Keluar dari tes?",
      message: "Jawabanmu di tes ini tidak disimpan.",
      confirmLabel: "Keluar",
      tone: "danger",
    });
    if (ok) {
      stopSpeaking();
      onQuit();
    }
  };

  if (!q) return null;
  const n = i + 1;
  return (
    <div ref={top} className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <SectionLabel tone="green">
              {title} · {SECTION_LABEL[q.section].toUpperCase()}
            </SectionLabel>
            <span className="text-[13px] font-bold text-ink-2 tabular-nums">
              Soal {n} dari {count}
            </span>
          </div>
          <ProgressBar
            pct={Math.round((n / count) * 100)}
            name="Kemajuan tes"
          />
        </div>
        <IconButton aria-label="Keluar dari tes" onClick={() => void quit()}>
          <LuX aria-hidden size={18} />
        </IconButton>
      </div>
      <QuestionView
        key={q.id}
        q={q}
        gens={gens}
        value={value}
        onChange={setValue}
        onSubmit={next}
      />
      <Button
        variant="green"
        size="lg"
        disabled={!filled}
        onClick={next}
        className="md:self-start md:px-10"
      >
        {i + 1 >= questions.length ? "Selesai" : "Lanjut"}
      </Button>
    </div>
  );
};

export default TestRunner;
