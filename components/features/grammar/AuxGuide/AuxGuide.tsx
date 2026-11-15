"use client";

import React from "react";

import { Ask } from "@/components/features/ask";
import BankPractice from "@/components/features/grammar/BankPractice/BankPractice";
import DrillGrid from "@/components/features/grammar/DrillGrid/DrillGrid";
import GrammarDetail from "@/components/features/grammar/GrammarDetail/GrammarDetail";
import Marked from "@/components/features/grammar/Marked/Marked";
import TargetMark from "@/components/shared/patterns/target-mark";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import {
  BE_DRILL,
  BE_ROWS,
  DETAIL,
  DO_DRILL,
  DO_ROWS,
} from "@/const/grammar.constant";
import { speak } from "@/lib/helpers/speech.helper";

// Sub-tab "Kata bantu": be vs do — detail, lalu dua tabel enam-bentuk + latihan.
const AuxGuide = React.memo(() => {
  return (
    <>
      <GrammarDetail d={DETAIL.bedo} />

      <Card pad="lg" className="gap-4">
        <div className="flex flex-col gap-1">
          <SectionLabel tone="green">SATU KALIMAT, LIMA TENSE</SectionLabel>
          <span className="text-sm leading-5 text-pretty text-ink-2">
            Kalimatnya tetap <b>I … busy</b>. Yang berubah hanya <b>to be</b>{" "}
            dan penanda waktunya. Baca berurutan sampai polanya otomatis. Kapan
            memakai was, have been, atau had been dibahas lengkap di sub-tab{" "}
            <b>Was / Have / Been</b>.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {BE_ROWS.map(([be, when, tense], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-2.5 odd:bg-sunken"
            >
              <span className="text-[17px] leading-6 font-bold wrap-anywhere text-ink">
                I <TargetMark>{be}</TargetMark> busy{" "}
                <span className="border-b-2 border-dashed border-control">
                  {when}
                </span>
                .
              </span>
              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <span className="text-right text-[12.5px] font-bold text-ink-2">
                  {tense}
                </span>
                <SpeakButton
                  onClick={() => speak("I " + be + " busy " + when + ".")}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t-2 border-dashed border-line pt-4">
          <DrillGrid
            label="LATIHAN · TERJEMAHKAN, UCAPKAN, LALU BUKA"
            rows={BE_DRILL}
          />
        </div>
      </Card>

      <Card pad="lg" className="gap-4">
        <div className="flex flex-col gap-1">
          <SectionLabel tone="green">
            SATU KATA KERJA, ENAM BENTUK · DI SINI DO / DOES / DID MUNCUL
          </SectionLabel>
          <span className="text-sm leading-5 text-pretty text-ink-2">
            Dengan kata kerja biasa, <b>be</b> tidak dipakai. Kalimat negatif
            memakai <b>do / does / did + not</b>, dan kata kerjanya kembali ke
            bentuk dasar. Bandingkan dengan tabel <i>I … busy</i> di atas.
            Kalimat tanya dibahas lengkap di sub-tab <b>Bertanya</b>.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {DO_ROWS.map(([sent, tense], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-2.5 odd:bg-sunken"
            >
              <span className="text-[17px] leading-6 font-bold wrap-anywhere text-ink">
                <Marked s={sent} />
              </span>
              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <span className="text-right text-[12.5px] font-bold text-ink-2">
                  {tense}
                </span>
                <SpeakButton
                  onClick={() => speak(sent.replace(/<\/?b>/g, ""))}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t-2 border-dashed border-line pt-4">
          <DrillGrid
            label="LATIHAN · TERJEMAHKAN, UCAPKAN, LALU BUKA"
            rows={DO_DRILL}
          />
        </div>
      </Card>

      <Ask.AuxList />
      <BankPractice topic="bedo" />
    </>
  );
});

AuxGuide.displayName = "AuxGuide";

export default AuxGuide;
