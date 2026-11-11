"use client";

import classNames from "classnames";
import React, { useState } from "react";

import SpeakButton from "@/components/ui/speak-button";
import type { AiWord, CheckResult } from "@/lib/types/ai.types";
import { useProgressStore } from "@/stores/useProgressStore";

const VERDICT: Record<CheckResult["verdict"], [string, string]> = {
  correct: ["✓ Sudah benar", "border-green-line bg-green-bg text-green-deep"],
  almost: ["≈ Hampir benar", "border-line-2 bg-sand text-ink"],
  incorrect: ["✗ Belum tepat", "border-red-line bg-red-bg text-red-deep"],
};

interface CheckResultCardProps {
  result: CheckResult;
  /** The card the sentence came from; enables "Pakai sebagai Kalimatku". */
  word?: AiWord;
}

// The AI's verdict on one sentence: status, the fixed version, why, and more
// natural alternatives.
const CheckResultCard = React.memo(({ result, word }: CheckResultCardProps) => {
  const setOwnSentence = useProgressStore((s) => s.setOwnSentence);
  const [saved, setSaved] = useState(false);
  const [label, tone] = VERDICT[result.verdict];

  return (
    <div className="flex flex-col gap-2.5">
      <span
        className={classNames(
          "self-start rounded-full border px-2.5 py-0.5 font-mono text-[11.5px] font-semibold",
          tone,
        )}
      >
        {label}
      </span>
      {result.verdict !== "correct" && (
        <div className="flex items-center gap-2 rounded-lg border border-green-line bg-card px-3 py-2">
          <span className="flex-1 font-serif text-[15.5px] text-ink italic">
            {result.corrected}
          </span>
          <SpeakButton size={26} icon={12} text={result.corrected} />
        </div>
      )}
      {!!result.typos?.length && (
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted">
            SALAH KETIK
          </span>
          <div className="flex flex-wrap gap-1.5">
            {result.typos.map((t) => (
              <span
                key={t.wrong}
                className="inline-flex items-center gap-1.5 rounded-full border border-line-2 bg-card px-2.5 py-0.5 text-[13px]"
              >
                <s className="text-red">{t.wrong}</s>
                <span className="text-faint">→</span>
                <b className="text-green-deep">{t.correct}</b>
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="m-0">{result.explanation}</p>
      {result.alternatives.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted">
            LEBIH NATURAL
          </span>
          {result.alternatives.map((a) => (
            <div key={a} className="flex items-center gap-2">
              <span className="flex-1 font-serif text-[14.5px] text-ink-2 italic">
                {a}
              </span>
              <SpeakButton size={24} icon={11} text={a} />
            </div>
          ))}
        </div>
      )}
      {word?.cardKey && result.verdict !== "correct" && (
        <button
          type="button"
          disabled={saved}
          onClick={() => {
            setOwnSentence(word.cardKey!, result.corrected);
            setSaved(true);
          }}
          className="cursor-pointer self-start border-0 border-b border-dotted border-green bg-transparent p-0 font-sans text-[12.5px] text-green disabled:cursor-default disabled:border-transparent"
        >
          {saved
            ? "✓ Tersimpan sebagai Kalimatku"
            : `Pakai sebagai Kalimatku "${word.word}"`}
        </button>
      )}
    </div>
  );
});

CheckResultCard.displayName = "CheckResultCard";

export default CheckResultCard;
