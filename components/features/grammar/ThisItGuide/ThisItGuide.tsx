"use client";

import React from "react";

import BankPractice from "@/components/features/grammar/BankPractice/BankPractice";
import GrammarDetail from "@/components/features/grammar/GrammarDetail/GrammarDetail";
import Card from "@/components/ui/card";
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
          "font-serif text-[16px] leading-[1.35] text-ink " + (className || "")
        }
      >
        {en}
      </span>
      <SpeakButton size={22} icon={11} onClick={() => speak(en)} />
    </div>
  );
};

// Sub-tab "This / It": detail → dekat/jauh × tunggal/jamak → it kosong → jawaban pendek → latihan soal.
const ThisItGuide = React.memo(() => {
  return (
    <>
      <GrammarDetail d={THIT_DETAIL} />

      <Card tone="ink" pad="lg" className="gap-3.5">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs tracking-[0.06em] text-green">
            DEKAT ATAU JAUH, SATU ATAU BANYAK
          </span>
          <span className="text-sm leading-[1.5] text-pretty text-ink-2">
            Bahasa Indonesia cukup &quot;ini&quot; dan &quot;itu&quot;. Bahasa
            Inggris juga melihat jumlahnya: this / that untuk satu, these /
            those untuk banyak, dan is berubah jadi are.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="hidden grid-cols-[130px_repeat(2,minmax(0,1fr))] gap-3 px-3 md:grid">
            <span />
            <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-blue">
              SATU
            </span>
            <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-green">
              BANYAK
            </span>
          </div>
          {THIT_TABLE.map(([label, one, many], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)] gap-2 rounded-lg px-3 py-2.5 odd:bg-sand md:grid-cols-[130px_repeat(2,minmax(0,1fr))] md:gap-3"
            >
              <span className="text-[13px] font-semibold text-ink">
                {label}
              </span>
              <Say en={one} />
              <Say en={many} />
            </div>
          ))}
        </div>
      </Card>

      <Card tone="ink" pad="lg" className="gap-3.5">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs tracking-[0.06em] text-green">
            IT &quot;KOSONG&quot; · SUBJEK WAJIB WALAU TIDAK MERUJUK APA-APA
          </span>
          <span className="text-sm leading-[1.5] text-pretty text-ink-2">
            Di bahasa Indonesia kalimat ini tanpa subjek. Di bahasa Inggris, it
            wajib ada, dan tidak bisa diganti this.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {THIT_EMPTY.map(([label, en, id], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)] gap-1 rounded-lg px-3 py-2.5 odd:bg-sand md:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-3"
            >
              <span className="text-[13px] font-semibold text-ink">
                {label}
              </span>
              <Say en={en} className="italic" />
              <span className="text-[13px] text-muted">{id}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card tone="ink" pad="lg" className="gap-3.5">
        <span className="font-mono text-xs tracking-[0.06em] text-green">
          JAWABAN PENDEK · UNTUK BENDA PAKAI IT (ATAU THEY)
        </span>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2.5">
          {THIT_SHORT.map(([q, yes, no], i) => (
            <div
              key={i}
              className="flex flex-col gap-1.5 rounded-[10px] border border-line px-4 py-3"
            >
              <Say en={q} className="italic" />
              <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-dashed border-line pt-1.5">
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
