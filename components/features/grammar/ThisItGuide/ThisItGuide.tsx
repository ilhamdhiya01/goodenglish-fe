"use client";

import React from "react";

import BankPractice from "@/components/features/grammar/BankPractice/BankPractice";
import GrammarDetail from "@/components/features/grammar/GrammarDetail/GrammarDetail";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import {
  THIT_DETAIL,
  THIT_EMPTY,
  THIT_SHORT,
  THIT_TABLE,
} from "@/const/this-it.constant";
import { speak } from "@/lib/helpers/speech.helper";

const Say = ({ en, className }: { en: string; className?: string }) => {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={
          "text-[15px] leading-[22px] font-bold text-ink " + (className || "")
        }
      >
        {en}
      </span>
      <SpeakButton size={28} icon={13} onClick={() => speak(en)} />
    </div>
  );
};

// Sub-tab "This / It": detail → dekat/jauh × tunggal/jamak → it kosong → jawaban pendek → latihan soal.
const ThisItGuide = React.memo(() => {
  return (
    <>
      <GrammarDetail d={THIT_DETAIL} />

      <Card pad="lg" className="gap-3.5">
        <div className="flex flex-col gap-1">
          <SectionLabel tone="green">
            DEKAT ATAU JAUH, SATU ATAU BANYAK
          </SectionLabel>
          <span className="text-sm leading-[22px] font-semibold text-pretty text-ink-2">
            Bahasa Indonesia cukup &quot;ini&quot; dan &quot;itu&quot;. Bahasa
            Inggris juga melihat jumlahnya: this / that untuk satu, these /
            those untuk banyak, dan is berubah jadi are.
          </span>
        </div>
        <div className="flex flex-col">
          <div className="hidden grid-cols-[130px_repeat(2,minmax(0,1fr))] gap-3 border-b-2 border-line px-1 pb-2 text-[12.5px] font-extrabold tracking-[0.07em] text-ink-3 uppercase md:grid">
            <span />
            <span>SATU</span>
            <span>BANYAK</span>
          </div>
          {THIT_TABLE.map(([label, one, many], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)] gap-2 border-b-2 border-line px-1 py-2.5 last:border-b-0 md:grid-cols-[130px_repeat(2,minmax(0,1fr))] md:items-center md:gap-3"
            >
              <span className="text-[13px] font-bold text-ink-2">{label}</span>
              <Say en={one} />
              <Say en={many} />
            </div>
          ))}
        </div>
      </Card>

      <Card pad="lg" className="gap-3.5">
        <div className="flex flex-col gap-1">
          <SectionLabel tone="green">
            IT &quot;KOSONG&quot; · SUBJEK WAJIB WALAU TIDAK MERUJUK APA-APA
          </SectionLabel>
          <span className="text-sm leading-[22px] font-semibold text-pretty text-ink-2">
            Di bahasa Indonesia kalimat ini tanpa subjek. Di bahasa Inggris, it
            wajib ada, dan tidak bisa diganti this.
          </span>
        </div>
        <div className="flex flex-col">
          {THIT_EMPTY.map(([label, en, id], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)] gap-1 border-b-2 border-line px-1 py-2.5 last:border-b-0 md:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-3"
            >
              <span className="text-[13px] font-bold text-ink-2">{label}</span>
              <Say en={en} />
              <span className="text-[13px] text-ink-2">{id}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card pad="lg" className="gap-3.5">
        <SectionLabel tone="green">
          JAWABAN PENDEK · UNTUK BENDA PAKAI IT (ATAU THEY)
        </SectionLabel>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2.5">
          {THIT_SHORT.map(([q, yes, no], i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-lg border-2 border-line bg-sunken px-4 py-3"
            >
              <Say en={q} />
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t-2 border-dashed border-line pt-2">
                <Say en={yes} />
                <Say en={no} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <BankPractice topic="thit" />
    </>
  );
});

ThisItGuide.displayName = "ThisItGuide";

export default ThisItGuide;
