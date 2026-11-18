import React from "react";

import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import { idOf } from "@/lib/content";
import type { Week } from "@/lib/types/vocab.types";

// The week's grammar focus. In the right column on wide screens; folded into
// a "Fokus tense" row under the cover on smaller ones. (Its conjunctions are
// word cards in the list: Jenis › Kata sambung.)
const TenseIntro = React.memo(({ d }: { d: Week }) => {
  return (
    <>
      <Card className="gap-3">
        <SectionLabel>Fokus tense</SectionLabel>
        <span className="text-base leading-[22px] font-extrabold text-ink">
          {d.tense?.name}
        </span>
        <span className="text-sm leading-5 text-ink-2">{d.tense?.use}</span>
        <div className="flex flex-col gap-1.5">
          {(d.tense?.form || []).map(([sign, text], i) => (
            <div key={i} className="flex flex-col">
              <div className="flex items-baseline gap-2.5">
                <span className="w-3.5 shrink-0 text-sm font-black text-accent-edge">
                  {sign}
                </span>
                <span className="min-w-0 text-sm font-bold text-ink">
                  {text}
                </span>
              </div>
              {!!idOf(text) && (
                <span className="ml-6 text-xs font-semibold text-ink-2">
                  {idOf(text)}
                </span>
              )}
            </div>
          ))}
        </div>
        <span className="text-[13.5px] leading-[19px] text-ink-2">
          <span className="font-extrabold text-ink">Penanda waktu: </span>
          {d.tense?.markers}
        </span>
        <div className="rounded-md bg-sunken px-3 py-2.5 text-[13.5px] leading-[19px] text-ink-2">
          {d.tense?.tip}
        </div>
        <SectionLabel className="mt-1">Contoh tense</SectionLabel>
        {(d.tense?.ex || []).map((t, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <span className="text-[15px] leading-[22px] font-bold text-ink">
              {t}
            </span>
            {!!idOf(t) && (
              <span className="text-[13px] text-ink-2">{idOf(t)}</span>
            )}
          </div>
        ))}
      </Card>
    </>
  );
});

TenseIntro.displayName = "TenseIntro";

export default TenseIntro;
