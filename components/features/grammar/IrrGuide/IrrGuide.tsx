"use client";

import React from "react";

import BankPractice from "@/components/features/grammar/BankPractice/BankPractice";
import GrammarDetail from "@/components/features/grammar/GrammarDetail/GrammarDetail";
import SectionLabel from "@/components/ui/section-label";
import { DETAIL, IRR } from "@/const/grammar.constant";
import { VERB_FORMS } from "@/lib/content";
import { useLevelStore } from "@/stores/useLevelStore";

// Sub-tab "Kata kerja tak beraturan": detail + grid kata paling sering.
const IrrGuide = React.memo(() => {
  const level = useLevelStore((s) => s.level);
  const IRF = VERB_FORMS.IRREG || {};
  const irregular = (level === "beginner" ? IRR.slice(0, 16) : IRR).map(
    ([base, past, id]) => ({
      base,
      past: IRF[base] ? IRF[base][0] + " → " + IRF[base][1] : past,
      id,
    }),
  );

  return (
    <>
      <GrammarDetail d={DETAIL.irr} />
      <div className="flex flex-col gap-2.5">
        <SectionLabel>KATA KERJA TIDAK BERATURAN PALING SERING</SectionLabel>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
          {irregular.map((v) => (
            <div
              key={v.base}
              className="flex flex-col gap-0.5 rounded-lg border-2 border-line bg-surface px-3 py-2.5"
            >
              <span className="text-[15px] font-extrabold text-ink">
                {v.base}
              </span>
              <span className="text-[13px] font-bold text-accent-edge">
                {v.past}
              </span>
              <span className="text-xs text-ink-2">{v.id}</span>
            </div>
          ))}
        </div>
      </div>
      <BankPractice topic="irr" />
    </>
  );
});

IrrGuide.displayName = "IrrGuide";

export default IrrGuide;
