"use client";

import classNames from "classnames";
import React from "react";

import AskPractice from "@/components/features/ask/AskPractice/AskPractice";
import DrillGrid from "@/components/features/grammar/DrillGrid/DrillGrid";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import TextButton from "@/components/ui/text-button";
import { idOf, VOCAB_ASK } from "@/lib/content";
import { speak } from "@/lib/helpers/speech.helper";
import { usePracticeSessionStore } from "@/stores/usePracticeSessionStore";

const speakable = (b: string) =>
  b
    .replace(/\s*\(.*$/, "")
    .replace(/^…\s*/, "")
    .replace(/\s*\/.*$/, "");

const Pair = ({ a, b, size = 14 }: { a: string; b: string; size?: number }) => {
  const ia = idOf(a);
  const ib = idOf(b);
  const tr = ia && ib && ia !== ib ? ia + " → " + ib : ib || ia;
  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)_auto] items-center gap-x-2 gap-y-0.5"
      style={{ fontSize: size }}
    >
      <span className="text-muted">{a}</span>
      <span className="text-faint">→</span>
      <span
        className="font-serif text-ink italic"
        style={{ fontSize: size + 2.5 }}
      >
        {b}
      </span>
      <SpeakButton size={24} icon={12} onClick={() => speak(speakable(b))} />
      {!!tr && (
        <span className="col-span-full -mt-0.5 text-[12.5px] text-faint">
          {tr}
        </span>
      )}
    </div>
  );
};

const Wrong = ({ e, dash = "border-line" }: { e: string[]; dash?: string }) => (
  <div
    className={classNames(
      "flex flex-col gap-0.5 border-t border-dashed pt-2",
      dash,
    )}
  >
    <span className="text-sm text-red line-through decoration-red/50 decoration-2">
      {e[0]}
    </span>
    <div className="flex items-center gap-2">
      <span className="text-[15px] font-semibold text-green">{e[1]}</span>
      <SpeakButton size={22} icon={11} onClick={() => speak(e[1])} />
    </div>
    {!!idOf(e[1]) && (
      <span className="text-[12.5px] text-faint">{idOf(e[1])}</span>
    )}
    <span className="text-[12.5px] text-muted">{e[2]}</span>
  </div>
);

interface Rule {
  id: string;
  no: string;
  title: string;
  formula: string;
  short: string;
  idea: string;
  steps: { t: string; b: string; ex: [string, string][] }[];
  traps: string[][];
  summary: string;
  drill: [string, string, string][];
}

// Sub-tab "Bertanya": cheat sheet 4 rumus + bedah per rumus + latihan otomatis.
// Port dari AskTab lama (bagian part='ask'; bagian 'aux' ada di grammar/AuxList).
const AskGuide = React.memo(() => {
  // Rumus yang terakhir dibuka diingat (store), supaya kembali ke sub-tab ini langsung ke latihan yang sama.
  const cur = usePracticeSessionStore((s) => s.sets.ask) || null;
  const setTopicSet = usePracticeSessionStore((s) => s.setTopicSet);
  const D = VOCAB_ASK;
  if (!D) return null;
  const rules: Rule[] = D.rules;
  const idx = rules.findIndex((r) => r.id === cur);
  const R = idx >= 0 ? rules[idx] : null;
  const pick = (id: string | null) => setTopicSet("ask", id || "");

  return (
    <>
      <div className="flex max-w-[760px] flex-col gap-1.5">
        <PageHeading>Cara bertanya: 4 rumus, 1 konsep</PageHeading>
        <Lead>{D.intro}</Lead>
      </div>

      <Card tone="ink" className="gap-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2.5">
          <SectionLabel tone="green">
            CHEAT SHEET · SIMPAN DI KEPALA
          </SectionLabel>
          <span className="text-[12.5px] text-muted">
            S = subjek · V = kata kerja · klik baris untuk dibedah
          </span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-2">
          {D.cheat.map(([n, name, f, ex]: string[]) => (
            <button
              type="button"
              key={n}
              onClick={() => pick("r" + n)}
              className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 text-left font-sans transition-colors hover:bg-sand"
            >
              <span className="w-[22px] font-mono text-xl font-bold text-green">
                {n}
              </span>
              <div className="flex min-w-0 flex-col gap-[3px]">
                <span className="text-[13px] font-bold">{name}</span>
                <span className="font-mono text-xs wrap-anywhere">{f}</span>
                <span className="font-serif text-[14.5px] text-ink-2 italic">
                  {ex}
                </span>
                <span className="text-xs text-faint">{idOf(ex)}</span>
              </div>
              <SpeakButton size={24} icon={12} text={ex} />
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-1.5 border-t border-dashed border-line pt-3">
          {D.auxCheat.map(([fam, list, act]: string[]) => (
            <div
              key={fam}
              className="flex items-baseline gap-2 rounded-md bg-sand px-2.5 py-1.5 text-[12.5px]"
            >
              <span className="w-11 flex-none font-mono font-bold text-green">
                {fam}
              </span>
              <span className="flex min-w-0 flex-col gap-px">
                <span className="font-mono text-xs wrap-anywhere">{list}</span>
                <span className="text-muted">{act}</span>
              </span>
            </div>
          ))}
        </div>
        <span className="text-[13px] leading-[1.5] text-ink-2">
          <b>Satu kalimat:</b> sudah ada kata bantu (BE / HAVE / modal)?
          pindahkan ke depan. Belum ada? tambahkan do/does/did dan kembalikan
          kata kerja ke bentuk dasar. Ada kata tanya? taruh di paling depan.
          Yang ditanya subjeknya? tanpa kata bantu. Ada pembuka sopan? urutan
          kembali normal.
        </span>
      </Card>

      <div className="flex flex-col gap-2.5">
        <SectionLabel>PILIH RUMUS UNTUK DIBEDAH PELAN-PELAN</SectionLabel>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-2.5">
          {rules.map((r) => {
            const on = r.id === cur;
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => pick(on ? null : r.id)}
                className={classNames(
                  "flex cursor-pointer flex-col gap-2 rounded-[10px] border-[1.5px] border-ink px-[18px] py-4 text-left font-sans transition-colors",
                  on ? "bg-ink text-paper" : "bg-card text-ink hover:bg-sand",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={classNames(
                      "font-mono text-xs tracking-[0.06em]",
                      on ? "text-mint" : "text-green",
                    )}
                  >
                    {r.no}
                  </span>
                  <span
                    className={classNames(
                      "text-xs",
                      on ? "text-ondark" : "text-muted",
                    )}
                  >
                    {on ? "terbuka ↓" : "klik untuk buka"}
                  </span>
                </div>
                <span className="text-[17px] leading-[1.25] font-bold">
                  {r.title}
                </span>
                <span
                  className={classNames(
                    "rounded-md px-2 py-1.5 font-mono text-xs wrap-anywhere",
                    on ? "bg-ink-4" : "bg-sand",
                  )}
                >
                  {r.formula}
                </span>
                <span
                  className={classNames(
                    "text-[13px] leading-[1.45]",
                    on ? "text-ondark" : "text-muted",
                  )}
                >
                  {r.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {R && (
        <Card tone="ink" pad="lg" className="gap-5 border-[1.5px]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <SectionLabel tone="green">{R.no} · DIBEDAH</SectionLabel>
              <span className="text-[26px] font-bold tracking-[-0.01em]">
                {R.title}
              </span>
              <span className="self-start rounded-md bg-sand px-2.5 py-2 font-mono text-[13.5px] wrap-anywhere">
                {R.formula}
              </span>
            </div>
            <TextButton onClick={() => pick(null)}>Tutup</TextButton>
          </div>
          <p className="m-0 max-w-[760px] text-[15px] leading-[1.55] text-pretty text-ink-2">
            {R.idea}
          </p>

          <div className="flex flex-col gap-3">
            {R.steps.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-3.5 rounded-[10px] border border-line px-4 py-3.5"
              >
                <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-green font-mono text-[13px] font-bold text-card">
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-2">
                  <span className="text-base leading-[1.3] font-bold">
                    {s.t}
                  </span>
                  <span className="text-sm leading-[1.55] text-pretty text-ink-2">
                    {s.b}
                  </span>
                  <div className="flex flex-col gap-[5px] border-t border-dashed border-line pt-2">
                    {s.ex.map(([a, b], j) => (
                      <Pair key={j} a={a} b={b} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
            <div className="flex flex-col gap-2.5 rounded-[10px] border border-red-line bg-red-bg px-4 py-3.5">
              <SectionLabel tone="red">JEBAKAN DI RUMUS INI</SectionLabel>
              {R.traps.map((e, i) => (
                <Wrong key={i} e={e} dash="border-red-line" />
              ))}
            </div>
            <div className="flex flex-col gap-2 rounded-[10px] border border-green-line bg-green-bg px-4 py-3.5">
              <SectionLabel tone="green">RINGKASAN SATU KALIMAT</SectionLabel>
              <span className="text-base leading-[1.5] font-semibold text-pretty text-green-deep">
                {R.summary}
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-line pt-4">
            <DrillGrid
              key={R.id}
              label={`LATIHAN ${R.no} · UBAH, UCAPKAN, LALU BUKA`}
              rows={R.drill}
              showIds
            />
          </div>

          <AskPractice rule={R.id} ruleNo={R.no} />

          <div className="flex flex-wrap justify-between gap-2.5 border-t border-dashed border-line pt-3.5">
            {idx > 0 ? (
              <TextButton
                className="rounded-full border-[1.5px] border-ink px-4 py-[9px] text-[13.5px] font-semibold text-ink"
                onClick={() => pick(rules[idx - 1].id)}
              >
                ← Rumus sebelumnya
              </TextButton>
            ) : (
              <span />
            )}
            {idx < rules.length - 1 && (
              <TextButton
                className="rounded-full bg-ink px-4 py-[9px] text-[13.5px] font-semibold text-paper"
                onClick={() => pick(rules[idx + 1].id)}
              >
                Rumus berikutnya →
              </TextButton>
            )}
          </div>
        </Card>
      )}

      <Card tone="ink">
        <div className="flex flex-col gap-[3px]">
          <span className="text-[17px] font-bold">
            Bertanya balik ke examiner / lawan bicara
          </span>
          <span className="text-[13px] text-muted">
            Di speaking kamu lebih banyak menjawab, tapi ini boleh dan berguna.
            Memakai Rumus 4 dengan benar juga menunjukkan grammatical range.
          </span>
        </div>
        {D.examiner.map(([en, id]: string[], i: number) => (
          <div
            key={i}
            className="flex flex-col gap-0.5 border-t border-dashed border-line pt-2.5"
          >
            <div className="flex items-center gap-2">
              <span className="font-serif text-[17px] italic">{en}</span>
              <SpeakButton size={22} icon={11} text={en} />
            </div>
            <span className="text-[13px] text-muted">{id}</span>
          </div>
        ))}
      </Card>
    </>
  );
});

AskGuide.displayName = "AskGuide";

export default AskGuide;
