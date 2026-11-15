"use client";

import React from "react";

import SectionLabel from "@/components/ui/section-label";
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
      <SectionLabel>KATA BANTU LENGKAP · BE – DO – HAVE – MODAL</SectionLabel>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
        {D.aux.map((a) => (
          <div
            key={a.fam}
            className="flex flex-col gap-2.5 rounded-xl border-2 border-line bg-surface px-[18px] py-4 edge-card"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[22px] leading-7 font-black text-accent-edge">
                {a.fam}
              </span>
              <span className="text-right text-[13px] font-semibold text-ink-2">
                {a.mean}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-[13.5px] font-bold text-ink">
              <span>
                <span className="font-semibold text-ink-2">sekarang · </span>
                {a.now}
              </span>
              <span>
                <span className="font-semibold text-ink-2">lampau · </span>
                {a.past}
              </span>
            </div>
            <div className="flex flex-col gap-1 border-t-2 border-dashed border-line pt-2.5">
              <span className="inline-flex flex-wrap items-center gap-2">
                <span className="text-[15px] leading-[22px] font-bold text-ink">
                  {a.ex}
                </span>
                <SpeakButton
                  size={28}
                  icon={13}
                  onClick={() => speak(a.ex.split("→").pop()!.trim())}
                />
              </span>
              {(() => {
                const [x, y] = a.ex.split("→").map((s) => s.trim());
                const ix = idOf(x);
                const iy = idOf(y);
                return ix && iy ? (
                  <span className="text-[13px] text-ink-2">
                    {ix} → {iy}
                  </span>
                ) : null;
              })()}
            </div>
            {!!a.note && (
              <span className="rounded-lg bg-sunken px-3 py-2 text-[13px] leading-[19px] font-semibold text-ink-2">
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
