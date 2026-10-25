"use client";

import React from "react";

import SpeakButton from "@/components/ui/speak-button";
import { idOf, VOCAB_ASK } from "@/lib/content";
import { speak } from "@/lib/helpers/speech.helper";

interface AuxRow {
  fam: string;
  mean: string;
  now: string;
  past: string;
  ex: string;
  note?: string;
}

// Kartu "kata bantu lengkap" (BE – DO – HAVE – MODAL) — dipakai di sub-tab Kata bantu.
const AuxList = React.memo(() => {
  const D = VOCAB_ASK as { aux?: AuxRow[] } | null;
  if (!D?.aux) return null;
  return (
    <div className="flex flex-col gap-2.5">
      <span className="font-mono text-xs tracking-[0.06em] text-muted">
        KATA BANTU LENGKAP · BE – DO – HAVE – MODAL
      </span>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
        {D.aux.map((a) => (
          <div
            key={a.fam}
            className="flex flex-col gap-2 rounded-[10px] border border-line bg-card px-[18px] py-4"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[22px] font-bold text-green">{a.fam}</span>
              <span className="text-right text-[12.5px] text-muted">
                {a.mean}
              </span>
            </div>
            <div className="flex flex-col gap-[3px] font-mono text-[12.5px]">
              <span>
                <span className="text-faint">sekarang · </span>
                {a.now}
              </span>
              <span>
                <span className="text-faint">lampau · </span>
                {a.past}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 border-t border-dashed border-line pt-2">
              <span className="inline-flex flex-wrap items-center gap-2">
                <span className="font-serif text-[15.5px] italic">{a.ex}</span>
                <SpeakButton
                  size={22}
                  icon={11}
                  onClick={() => speak(a.ex.split("→").pop()!.trim())}
                />
              </span>
              {(() => {
                const [x, y] = a.ex.split("→").map((s) => s.trim());
                const ix = idOf(x);
                const iy = idOf(y);
                return ix && iy ? (
                  <span className="text-[12.5px] text-faint">
                    {ix} → {iy}
                  </span>
                ) : null;
              })()}
            </div>
            {!!a.note && (
              <span className="rounded-md bg-tint-col px-[9px] py-1.5 text-[12.5px] leading-[1.45] text-ink-col">
                {a.note}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

AuxList.displayName = "AuxList";

export default AuxList;
