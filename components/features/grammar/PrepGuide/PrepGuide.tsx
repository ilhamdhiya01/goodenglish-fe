"use client";

import React from "react";

import BankPractice from "@/components/features/grammar/BankPractice/BankPractice";
import GrammarDetail from "@/components/features/grammar/GrammarDetail/GrammarDetail";
import Card from "@/components/ui/card";
import SpeakButton from "@/components/ui/speak-button";
import {
  PREP_DETAIL,
  PREP_PAIRS,
  PREP_TABLE,
} from "@/const/prepositions.constant";
import { speak } from "@/lib/helpers/speech.helper";

const COLS: [string, string][] = [
  ["IN", "#1F4E86"],
  ["ON", "#1F6B57"],
  ["AT", "#B42318"],
];

// Sub-tab "In / On / At": detail → tabel waktu/tempat/kendaraan → pasangan yang sering tertukar.
const PrepGuide = React.memo(() => {
  return (
    <>
      <GrammarDetail d={PREP_DETAIL} />

      <Card tone="ink" pad="lg" className="gap-3.5">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs tracking-[0.06em] text-green">
            TABEL RINGKAS · IN, ON, AT
          </span>
          <span className="text-sm leading-[1.5] text-pretty text-ink-2">
            Baca per baris. Dari kiri ke kanan, cakupannya makin sempit: luas →
            permukaan / hari → titik tepat.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {PREP_TABLE.map(([cat, ...vals], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)] gap-2 rounded-lg px-3 py-2.5 odd:bg-sand md:grid-cols-[120px_repeat(3,minmax(0,1fr))] md:gap-3"
            >
              <span className="text-[13px] font-semibold text-ink">{cat}</span>
              {vals.map((v, j) => (
                <div key={j} className="flex min-w-0 flex-col gap-0.5">
                  <span
                    className="font-mono text-[11px] font-bold tracking-[0.06em]"
                    style={{ color: COLS[j][1] }}
                  >
                    {COLS[j][0]}
                  </span>
                  <span className="font-serif text-[16px] leading-[1.35] text-pretty text-ink">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Card tone="ink" pad="lg" className="gap-3.5">
        <span className="font-mono text-xs tracking-[0.06em] text-green">
          SERING TERTUKAR
        </span>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-2.5">
          {PREP_PAIRS.map(([a, ai, b, bi], i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-[10px] border border-line px-4 py-3"
            >
              {[
                [a, ai],
                [b, bi],
              ].map(([en, id], k) => (
                <div key={k} className="flex flex-col gap-px">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-[17px] text-ink italic">
                      {en}
                    </span>
                    <SpeakButton
                      size={22}
                      icon={11}
                      onClick={() => speak(en)}
                    />
                  </div>
                  <span className="text-[12.5px] text-muted">{id}</span>
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
