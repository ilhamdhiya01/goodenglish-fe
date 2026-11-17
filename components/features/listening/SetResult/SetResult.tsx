import React from "react";

import Jalak from "@/components/brand/Jalak";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import { PASS_RATE } from "@/lib/helpers/listening.helper";

interface SetResultProps {
  /** Accuracy units: words right (Dikte) or answers right. */
  score: number;
  total: number;
  /** e.g. "8 dari 10 kalimat sempurna". */
  detail?: string;
  stage: number;
  /** The next stage was just opened by this set. */
  unlocked: boolean;
  onAgain: () => void;
  onNext?: () => void;
  children?: React.ReactNode;
}

// End of a set, in the style of the grammar practice result.
const SetResult = ({
  score,
  total,
  detail,
  stage,
  unlocked,
  onAgain,
  onNext,
  children,
}: SetResultProps) => {
  const rate = total ? score / total : 0;
  const pct = Math.round(rate * 100);
  return (
    <div className="flex flex-col gap-4">
      <Card
        tone="done"
        pad="lg"
        className="flex-row items-start gap-4"
        role="status"
      >
        <Jalak
          mood={rate >= PASS_RATE ? "senang" : "biasa"}
          className="shrink-0"
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <SectionLabel tone={rate >= PASS_RATE ? "ok" : "muted"}>
            HASIL SET · TAHAP {stage}
          </SectionLabel>
          <span className="text-2xl font-black text-ink tabular-nums">
            Akurasi {pct}%
          </span>
          {detail && (
            <span className="text-sm font-bold text-ink-2">{detail}</span>
          )}
          <span className="text-sm leading-5 text-ink-2">
            {unlocked
              ? `Tahap ${stage + 1} sekarang terbuka. Lanjut kalau sudah siap.`
              : rate >= PASS_RATE
                ? "Bagus, telingamu sudah menangkap sebagian besar."
                : "Belum 80%. Ulangi satu set lagi; soalnya akan berbeda."}
          </span>
        </div>
      </Card>
      {children}
      <div className="flex flex-wrap gap-3">
        <Button variant={onNext ? "outline" : "green"} onClick={onAgain}>
          Set baru
        </Button>
        {onNext && (
          <Button variant="green" onClick={onNext}>
            Lanjut ke tahap {stage + 1}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SetResult;
