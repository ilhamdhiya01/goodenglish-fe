"use client";

import React from "react";

import { Ask } from "@/components/features/ask";
import BankPractice from "@/components/features/grammar/BankPractice/BankPractice";
import DrillGrid from "@/components/features/grammar/DrillGrid/DrillGrid";
import GrammarDetail from "@/components/features/grammar/GrammarDetail/GrammarDetail";
import Card from "@/components/ui/card";
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

      <Card tone="ink" pad="lg" className="gap-3.5">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs tracking-[0.06em] text-green">
            SATU KALIMAT, LIMA TENSE
          </span>
          <span className="text-sm leading-[1.5] text-pretty text-ink-2">
            Kalimatnya tetap <b>I … busy</b>. Yang berubah hanya <b>to be</b>{" "}
            dan penanda waktunya. Baca berurutan sampai polanya otomatis. Kapan
            memakai was, have been, atau had been dibahas lengkap di sub-tab{" "}
            <b>Was / Have / Been</b>.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {BE_ROWS.map(([be, when, tense, c], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-[9px] odd:bg-sand"
            >
              <span className="font-serif text-[19px] leading-[1.3] wrap-anywhere">
                I{" "}
                <span className="font-bold italic" style={{ color: c }}>
                  {be}
                </span>{" "}
                busy{" "}
                <span className="border-b-2" style={{ borderColor: c }}>
                  {when}
                </span>
                .
              </span>
              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <span className="text-right font-mono text-[11.5px] text-muted">
                  {tense}
                </span>
                <SpeakButton
                  onClick={() => speak("I " + be + " busy " + when + ".")}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-line pt-3.5">
          <DrillGrid
            label="LATIHAN · TERJEMAHKAN, UCAPKAN, LALU BUKA"
            rows={BE_DRILL}
          />
        </div>
      </Card>

      <Card tone="ink" pad="lg" className="gap-3.5">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs tracking-[0.06em] text-green">
            SATU KATA KERJA, ENAM BENTUK · DI SINI DO / DOES / DID MUNCUL
          </span>
          <span className="text-sm leading-[1.5] text-pretty text-ink-2">
            Dengan kata kerja biasa, <b>be</b> tidak dipakai. Kalimat negatif
            memakai <b>do / does / did + not</b>, dan kata kerjanya kembali ke
            bentuk dasar. Bandingkan dengan tabel <i>I … busy</i> di atas.
            Kalimat tanya dibahas lengkap di sub-tab <b>Bertanya</b>.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {DO_ROWS.map(([sent, tense, c], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-[9px] odd:bg-sand"
            >
              <span className="font-serif text-[19px] leading-[1.3] wrap-anywhere">
                {sent.split(/(<b>.*?<\/b>)/g).map((p, k) =>
                  p.startsWith("<b>") ? (
                    <b key={k} className="italic" style={{ color: c }}>
                      {p.slice(3, -4)}
                    </b>
                  ) : (
                    <span key={k}>{p}</span>
                  ),
                )}
              </span>
              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <span className="text-right font-mono text-[11.5px] text-muted">
                  {tense}
                </span>
                <SpeakButton
                  onClick={() => speak(sent.replace(/<\/?b>/g, ""))}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-line pt-3.5">
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
