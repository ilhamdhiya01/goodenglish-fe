"use client";

import React from "react";

import BankPractice from "@/components/features/grammar/BankPractice/BankPractice";
import GrammarDetail from "@/components/features/grammar/GrammarDetail/GrammarDetail";
import Card from "@/components/ui/card";
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

// Kalimat dengan <b>…</b> → bagian yang berubah diberi warna.
const Marked = ({ s, c }: { s: string; c: string }) => {
  return (
    <>
      {s.split(/(<b>.*?<\/b>)/g).map((p, k) =>
        p.startsWith("<b>") ? (
          <b key={k} className="italic" style={{ color: c }}>
            {p.slice(3, -4)}
          </b>
        ) : (
          <span key={k}>{p}</span>
        ),
      )}
    </>
  );
};

// Satu jalur garis waktu: penanda "titik lampau" & "sekarang", lalu batang dari → sampai.
const Track = ({
  from,
  to,
  now,
  c,
}: {
  from: number;
  to: number;
  now: boolean;
  c: string;
}) => {
  return (
    <div className="relative h-7">
      <div className="absolute inset-x-0 top-1/2 h-px bg-line-2" />
      <div
        className="absolute inset-y-0 border-l-[1.5px] border-dashed border-faint"
        style={{ left: WHB_PAST + "%" }}
      />
      <div className="absolute inset-y-0 right-0 border-l-2 border-ink" />
      <div
        className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full"
        style={{
          left: from + "%",
          width: Math.max(to - from, 2) + "%",
          background: c,
        }}
      />
      {now && (
        <div
          className="absolute top-1/2 right-0 h-0 w-0 -translate-y-1/2 border-y-[7px] border-l-[9px] border-y-transparent"
          style={{ borderLeftColor: c }}
        />
      )}
    </div>
  );
};

// Sub-tab "Was / Have / Been": detail → garis waktu → satu kalimat lintas bentuk →
// have sebagai punya vs kata bantu → pasangan yang sering tertukar → latihan soal per set.
const BeenGuide = React.memo(() => {
  return (
    <>
      <GrammarDetail d={WHB_DETAIL} />

      <Card tone="ink" pad="lg" className="gap-3.5">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs tracking-[0.06em] text-green">
            GARIS WAKTU · DARI KIRI (DULU) KE KANAN (SEKARANG)
          </span>
          <span className="text-sm leading-[1.5] text-pretty text-ink-2">
            Garis putus-putus adalah <b>titik lampau</b> yang sedang diceritakan
            (mis. &quot;waktu aku datang&quot;). Garis tegas di kanan adalah{" "}
            <b>sekarang</b>. Batang yang menyentuh sekarang (dengan panah)
            memakai <b>have</b>. Batang yang berhenti di titik lampau memakai{" "}
            <b>had</b>.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {WHB_TIMELINE.map(([form, ex, from, to, now, note, c], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)] gap-2 rounded-lg px-3 py-2.5 odd:bg-sand md:grid-cols-[190px_minmax(0,1fr)] md:items-center md:gap-4"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span
                  className="font-mono text-[13px] font-bold"
                  style={{ color: c }}
                >
                  {form}
                </span>
                <span className="text-[12.5px] leading-[1.35] text-muted">
                  {note}
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <Track from={from} to={to} now={now} c={c} />
                <div className="flex items-center gap-2">
                  <span className="font-serif text-[16px] leading-[1.35] text-ink italic">
                    {ex}
                  </span>
                  <SpeakButton size={22} icon={11} onClick={() => speak(ex)} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] px-3 md:grid-cols-[190px_minmax(0,1fr)] md:gap-4">
          <span className="hidden md:block" />
          <div className="relative h-5 font-mono text-[11px] tracking-[0.04em] text-muted">
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

      <Card tone="ink" pad="lg" className="gap-3.5">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs tracking-[0.06em] text-green">
            SATU KALIMAT, BERUBAH TITIK ACUAN
          </span>
          <span className="text-sm leading-[1.5] text-pretty text-ink-2">
            Subjeknya tetap <b>she</b>. Perhatikan bagian berwarna: is → was →
            has been → had been. Dua baris terakhir versi kegiatan (+ -ing).
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {WHB_ROWS.map(([sent, tense, c], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-[9px] odd:bg-sand"
            >
              <span className="font-serif text-[19px] leading-[1.3] wrap-anywhere">
                <Marked s={sent} c={c} />
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
      </Card>

      <Card tone="ink" pad="lg" className="gap-3.5">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs tracking-[0.06em] text-green">
            HAVE: &quot;PUNYA&quot; ATAU KATA BANTU?
          </span>
          <span className="text-sm leading-[1.5] text-pretty text-ink-2">
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
            <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-gold">
              HAVE = PUNYA
            </span>
            <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-green">
              HAVE + V3 = SUDAH
            </span>
          </div>
          {WHB_HAVE.map(([own, aux, note], i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)] gap-2 rounded-lg px-3 py-2.5 odd:bg-sand md:grid-cols-[110px_repeat(2,minmax(0,1fr))] md:gap-3"
            >
              <span className="text-[13px] font-semibold text-ink">{note}</span>
              {[own, aux].map((s, j) => (
                <div key={j} className="flex min-w-0 items-center gap-2">
                  <span
                    className={
                      "font-mono text-[10.5px] font-bold md:hidden " +
                      (j ? "text-green" : "text-gold")
                    }
                  >
                    {j ? "SUDAH" : "PUNYA"}
                  </span>
                  <span className="font-serif text-[16px] leading-[1.35] text-ink">
                    {s}
                  </span>
                  <SpeakButton size={22} icon={11} onClick={() => speak(s)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Card tone="ink" pad="lg" className="gap-3.5">
        <span className="font-mono text-xs tracking-[0.06em] text-green">
          SERING TERTUKAR · BEDA SATU KATA, BEDA ARTI
        </span>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-2.5">
          {WHB_PAIRS.map(([a, ai, b, bi], i) => (
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

      <BankPractice topic="whb" />
    </>
  );
});

BeenGuide.displayName = "BeenGuide";

export default BeenGuide;
