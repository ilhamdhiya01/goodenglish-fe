"use client";

import React from "react";

import BankPractice from "@/components/features/grammar/BankPractice/BankPractice";
import GrammarDetail from "@/components/features/grammar/GrammarDetail/GrammarDetail";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import {
  PREP_DETAIL,
  PREP_PAIRS,
  PREP_TABLE,
} from "@/const/prepositions.constant";
import { speak } from "@/lib/helpers/speech.helper";

const COLS = ["IN", "ON", "AT"];

// Sub-tab "In / On / At": detail → tabel waktu/tempat/kendaraan → pasangan yang sering tertukar.
const PrepGuide = React.memo(() => {
  return (
    <>
      <GrammarDetail d={PREP_DETAIL} />

      <Card pad="lg" className="gap-4">
        <div className="flex flex-col gap-1">
          <SectionLabel tone="green">TABEL RINGKAS · IN, ON, AT</SectionLabel>
          <span className="text-sm leading-5 text-pretty text-ink-2">
            Baca per baris. Dari kiri ke kanan, cakupannya makin sempit: luas →
            permukaan / hari → titik tepat.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {PREP_TABLE.map(([cat, ...vals], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)] gap-2 rounded-lg px-3 py-2.5 odd:bg-sunken md:grid-cols-[120px_repeat(3,minmax(0,1fr))] md:gap-3"
            >
              <span className="text-[13.5px] font-extrabold text-ink">
                {cat}
              </span>
              {vals.map((v, j) => (
                <div key={j} className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[12px] font-black tracking-[0.07em] text-accent-edge">
                    {COLS[j]}
                  </span>
                  <span className="text-[15px] leading-[22px] font-bold text-pretty text-ink">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Card pad="lg" className="gap-4">
        <SectionLabel tone="green">SERING TERTUKAR</SectionLabel>
        <div className="grid gap-3 md:grid-cols-2">
          {PREP_PAIRS.map(([a, ai, b, bi], i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-xl border-2 border-line px-4 py-3"
            >
              {[
                [a, ai],
                [b, bi],
              ].map(([en, id], k) => (
                <div key={k} className="flex flex-col gap-px">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-[22px] font-bold text-ink">
                      {en}
                    </span>
                    <SpeakButton
                      size={28}
                      icon={13}
                      onClick={() => speak(en)}
                    />
                  </div>
                  <span className="text-[13px] text-ink-2">{id}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
      <BankPractice topic="prep" />
    </>
  );
});

PrepGuide.displayName = "PrepGuide";

export default PrepGuide;
