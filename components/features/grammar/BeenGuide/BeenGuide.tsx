"use client";

import React from "react";

import BankPractice from "@/components/features/grammar/BankPractice/BankPractice";
import GrammarDetail from "@/components/features/grammar/GrammarDetail/GrammarDetail";
import Marked from "@/components/features/grammar/Marked/Marked";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import {
  WHB_DETAIL,
  WHB_HAVE,
  WHB_PAIRS,
  WHB_PAST,
  WHB_ROWS,
  WHB_TIMELINE,
} from "@/const/was-have-been.constant";
import { speak } from "@/lib/helpers/speech.helper";

// Satu jalur garis waktu: sumbu, penanda "titik lampau" (putus-putus) dan
// "sekarang" (garis tegas), lalu batang dari → sampai. Batang yang menyentuh
// sekarang (have) berwarna aksen dengan panah; yang berhenti di masa lampau
// (had / was) netral. Bentuk dan keterangannya selalu tertulis di sebelahnya.
const Track = ({
  from,
  to,
  now,
}: {
  from: number;
  to: number;
  now: boolean;
}) => (
  <div aria-hidden className="relative h-7">
    <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-ink" />
    <div
      className="absolute inset-y-0 border-l-2 border-dashed border-control"
      style={{ left: WHB_PAST + "%" }}
    />
    <div className="absolute inset-y-0 right-0 border-l-[3px] border-ink" />
    <div
      className={
        "absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full " +
        (now ? "bg-accent" : "bg-control")
      }
      style={{ left: from + "%", width: Math.max(to - from, 2) + "%" }}
    />
    {now && (
      <div className="absolute top-1/2 right-0 h-0 w-0 -translate-y-1/2 border-y-[7px] border-l-[10px] border-y-transparent border-l-accent" />
    )}
  </div>
);

// Sub-tab "Was / Have / Been": detail → garis waktu → satu kalimat lintas bentuk →
// have sebagai punya vs kata bantu → pasangan yang sering tertukar → latihan soal per set.
const BeenGuide = React.memo(() => {
  return (
    <>
      <GrammarDetail d={WHB_DETAIL} />

      <Card pad="lg" className="gap-4">
        <div className="flex flex-col gap-1">
          <SectionLabel tone="green">
            GARIS WAKTU · DARI KIRI (DULU) KE KANAN (SEKARANG)
          </SectionLabel>
          <span className="text-sm leading-5 text-pretty text-ink-2">
            Garis putus-putus adalah <b>titik lampau</b> yang sedang diceritakan
            (mis. &quot;waktu aku datang&quot;). Garis tegas di kanan adalah{" "}
            <b>sekarang</b>. Batang yang menyentuh sekarang (dengan panah)
            memakai <b>have</b>. Batang yang berhenti di titik lampau memakai{" "}
            <b>had</b>.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {WHB_TIMELINE.map(([form, ex, from, to, now, note], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)] gap-2 rounded-lg px-3 py-2.5 odd:bg-sunken md:grid-cols-[190px_minmax(0,1fr)] md:items-center md:gap-4"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span
                  className={
                    "text-sm font-black " +
                    (now ? "text-accent-edge" : "text-ink")
                  }
                >
                  {form}
                </span>
                <span className="text-[13px] leading-[18px] text-ink-2">
                  {note}
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <Track from={from} to={to} now={now} />
                <div className="flex items-center gap-2">
                  <span className="text-[15px] leading-[22px] font-bold text-ink">
                    {ex}
                  </span>
                  <SpeakButton size={28} icon={13} onClick={() => speak(ex)} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] px-3 md:grid-cols-[190px_minmax(0,1fr)] md:gap-4">
          <span className="hidden md:block" />
          <div className="relative h-5 text-[12px] font-extrabold tracking-[0.06em] text-ink-2">
            <span className="absolute left-0">DULU</span>
            <span
              className="absolute -translate-x-1/2"
              style={{ left: WHB_PAST + "%" }}
            >
              TITIK LAMPAU
            </span>
            <span className="absolute right-0">SEKARANG</span>
          </div>
        </div>
      </Card>

      <Card pad="lg" className="gap-4">
        <div className="flex flex-col gap-1">
          <SectionLabel tone="green">
            SATU KALIMAT, BERUBAH TITIK ACUAN
          </SectionLabel>
          <span className="text-sm leading-5 text-pretty text-ink-2">
            Subjeknya tetap <b>she</b>. Perhatikan bagian berwarna: is → was →
            has been → had been. Dua baris terakhir versi kegiatan (+ -ing).
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {WHB_ROWS.map(([sent, tense], i) => (
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
      </Card>

      <Card pad="lg" className="gap-4">
        <div className="flex flex-col gap-1">
          <SectionLabel tone="green">
            HAVE: &quot;PUNYA&quot; ATAU KATA BANTU?
          </SectionLabel>
          <span className="text-sm leading-5 text-pretty text-ink-2">
            Lihat kata sesudahnya. Kalau benda (a car, a cold) → have ={" "}
            <b>punya</b>, negatif & tanya pakai <b>do</b>. Kalau V3 (bought,
            been, had) → have = <b>kata bantu &quot;sudah&quot;</b>, negatif &
            tanya cukup pindahkan have. Karena itu <i>have had</i> itu wajar:
            have (kata bantu) + had (V3 dari have).
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="hidden grid-cols-[110px_repeat(2,minmax(0,1fr))] gap-3 px-3 md:grid">
            <span />
            <SectionLabel>HAVE = PUNYA</SectionLabel>
            <SectionLabel>HAVE + V3 = SUDAH</SectionLabel>
          </div>
          {WHB_HAVE.map(([own, aux, note], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)] gap-2 rounded-lg px-3 py-2.5 odd:bg-sunken md:grid-cols-[110px_repeat(2,minmax(0,1fr))] md:gap-3"
            >
              <span className="text-[13.5px] font-extrabold text-ink">
                {note}
              </span>
              {[own, aux].map((s, j) => (
                <div key={j} className="flex min-w-0 items-center gap-2">
                  <span className="text-[11.5px] font-extrabold tracking-[0.06em] text-ink-2 md:hidden">
                    {j ? "SUDAH" : "PUNYA"}
                  </span>
                  <span className="text-[15px] leading-[22px] font-bold text-ink">
                    {s}
                  </span>
                  <SpeakButton size={28} icon={13} onClick={() => speak(s)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Card pad="lg" className="gap-4">
        <SectionLabel tone="green">
          SERING TERTUKAR · BEDA SATU KATA, BEDA ARTI
        </SectionLabel>
        <div className="grid gap-3 md:grid-cols-2">
          {WHB_PAIRS.map(([a, ai, b, bi], i) => (
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

      <BankPractice topic="whb" />
    </>
  );
});

BeenGuide.displayName = "BeenGuide";

export default BeenGuide;
