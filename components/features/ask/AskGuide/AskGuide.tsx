"use client";

import classNames from "classnames";
import React from "react";

import AskPractice from "@/components/features/ask/AskPractice/AskPractice";
import DrillGrid from "@/components/features/grammar/DrillGrid/DrillGrid";
import Correction from "@/components/shared/patterns/correction";
import Button from "@/components/ui/button";
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
      <span className="font-semibold text-ink-2">{a}</span>
      <span aria-hidden className="font-extrabold text-ink-3">
        →
      </span>
      <span
        className="leading-[22px] font-bold text-ink"
        style={{ fontSize: size + 1 }}
      >
        {b}
      </span>
      <SpeakButton size={28} icon={13} onClick={() => speak(speakable(b))} />
      {!!tr && (
        <span className="col-span-full -mt-0.5 text-[13px] text-ink-2">
          {tr}
        </span>
      )}
    </div>
  );
};

// ✕ wrong → ✓ right (speakable) → translation + reason, as a Correction.
const Wrong = ({ e, dash = "border-line" }: { e: string[]; dash?: string }) => (
  <div className={classNames("border-t-2 border-dashed pt-2.5", dash)}>
    <Correction
      wrong={e[0]}
      right={e[1]}
      speak={e[1]}
      why={
        <>
          {!!idOf(e[1]) && (
            <span className="block font-normal">{idOf(e[1])}</span>
          )}
          {e[2]}
        </>
      }
    />
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

      <Card className="gap-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2.5">
          <SectionLabel tone="green">
            CHEAT SHEET · SIMPAN DI KEPALA
          </SectionLabel>
          <span className="text-[13px] font-semibold text-ink-2">
            S = subjek · V = kata kerja · klik baris untuk dibedah
          </span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-2">
          {D.cheat.map(([n, name, f, ex]: string[]) => (
            // Speaker sits beside the row button, not inside it: nested
            // <button>s are invalid HTML and break hydration.
            <div
              key={n}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg border-2 border-line pr-3 transition-colors hover:bg-sunken"
            >
              <button
                type="button"
                onClick={() => pick("r" + n)}
                className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg py-3 pl-3.5 text-left focus-ring"
              >
                <span className="w-[22px] text-xl font-black text-accent-edge tabular-nums">
                  {n}
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[13px] font-extrabold text-ink-2">
                    {name}
                  </span>
                  <span className="text-[13px] font-bold wrap-anywhere text-ink">
                    {f}
                  </span>
                  <span className="text-[15px] leading-[22px] font-bold text-ink">
                    {ex}
                  </span>
                  <span className="text-[13px] text-ink-2">{idOf(ex)}</span>
                </div>
              </button>
              <SpeakButton size={28} icon={13} text={ex} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-2 border-t-2 border-dashed border-line pt-3.5">
          {D.auxCheat.map(([fam, list, act]: string[]) => (
            <div
              key={fam}
              className="flex items-baseline gap-2.5 rounded-lg bg-sunken px-3 py-2 text-[13px]"
            >
              <span className="w-12 flex-none font-black text-accent-edge">
                {fam}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-bold wrap-anywhere text-ink">{list}</span>
                <span className="text-ink-2">{act}</span>
              </span>
            </div>
          ))}
        </div>
        <span className="text-[13.5px] leading-5 font-semibold text-ink-2">
          <b className="font-extrabold text-ink">Satu kalimat:</b> sudah ada
          kata bantu (BE / HAVE / modal)? pindahkan ke depan. Belum ada?
          tambahkan do/does/did dan kembalikan kata kerja ke bentuk dasar. Ada
          kata tanya? taruh di paling depan. Yang ditanya subjeknya? tanpa kata
          bantu. Ada pembuka sopan? urutan kembali normal.
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
                  "flex press cursor-pointer flex-col gap-2 rounded-xl border-2 px-[18px] py-4 text-left text-ink edge-card focus-ring",
                  on
                    ? "border-accent bg-accent-tint [--edge:var(--color-accent)]"
                    : "border-control bg-surface [--edge:var(--color-control)] hover:bg-sunken",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <SectionLabel tone="green">{r.no}</SectionLabel>
                  <span
                    className={classNames(
                      "text-xs font-bold",
                      on ? "text-accent-edge" : "text-ink-2",
                    )}
                  >
                    {on ? "terbuka ↓" : "klik untuk buka"}
                  </span>
                </div>
                <span className="text-[17px] leading-[22px] font-extrabold">
                  {r.title}
                </span>
                <span
                  className={classNames(
                    "rounded-md px-2.5 py-1.5 text-[13px] font-bold wrap-anywhere",
                    on ? "bg-surface" : "bg-sunken",
                  )}
                >
                  {r.formula}
                </span>
                <span className="text-[13px] leading-[19px] font-semibold text-ink-2">
                  {r.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {R && (
        <Card pad="lg" className="gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <SectionLabel tone="green">{R.no} · DIBEDAH</SectionLabel>
              <span className="text-[26px] leading-8 font-black tracking-[-0.01em] text-ink">
                {R.title}
              </span>
              <span className="mt-1 self-start rounded-lg border-2 border-line bg-sunken px-3 py-2 text-[15px] font-bold wrap-anywhere text-ink">
                {R.formula}
              </span>
            </div>
            <TextButton onClick={() => pick(null)}>Tutup</TextButton>
          </div>
          <p className="m-0 max-w-[760px] text-[15px] leading-[22px] font-semibold text-pretty text-ink-2">
            {R.idea}
          </p>

          <div className="flex flex-col gap-3">
            {R.steps.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-3.5 rounded-xl border-2 border-line px-4 py-3.5"
              >
                <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent-tint text-[13px] font-black text-accent-edge">
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-2">
                  <span className="text-base leading-[22px] font-extrabold text-ink">
                    {s.t}
                  </span>
                  <span className="text-sm leading-[22px] font-semibold text-pretty text-ink-2">
                    {s.b}
                  </span>
                  <div className="flex flex-col gap-2 border-t-2 border-dashed border-line pt-2.5">
                    {s.ex.map(([a, b], j) => (
                      <Pair key={j} a={a} b={b} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
            <div className="flex flex-col gap-2.5 rounded-xl border-2 border-bad-line bg-bad-bg px-4 py-3.5">
              <SectionLabel tone="red">JEBAKAN DI RUMUS INI</SectionLabel>
              {R.traps.map((e, i) => (
                <Wrong key={i} e={e} dash="border-bad-line" />
              ))}
            </div>
            <div className="flex flex-col gap-2 self-start rounded-xl border-2 border-accent-line bg-accent-tint px-4 py-3.5">
              <SectionLabel tone="green">RINGKASAN SATU KALIMAT</SectionLabel>
              <span className="text-base leading-[22px] font-bold text-pretty text-ink">
                {R.summary}
              </span>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-line pt-4">
            <DrillGrid
              key={R.id}
              label={`LATIHAN ${R.no} · UBAH, UCAPKAN, LALU BUKA`}
              rows={R.drill}
              showIds
            />
          </div>

          <AskPractice rule={R.id} ruleNo={R.no} />

          <div className="flex flex-wrap justify-between gap-2.5 border-t-2 border-dashed border-line pt-3.5">
            {idx > 0 ? (
              <Button size="sm" onClick={() => pick(rules[idx - 1].id)}>
                ← Rumus sebelumnya
              </Button>
            ) : (
              <span />
            )}
            {idx < rules.length - 1 && (
              <Button size="sm" onClick={() => pick(rules[idx + 1].id)}>
                Rumus berikutnya →
              </Button>
            )}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-1">
          <span className="text-[17px] leading-[22px] font-extrabold text-ink">
            Bertanya balik ke examiner / lawan bicara
          </span>
          <span className="text-[13px] font-semibold text-ink-2">
            Di speaking kamu lebih banyak menjawab, tapi ini boleh dan berguna.
            Memakai Rumus 4 dengan benar juga menunjukkan grammatical range.
          </span>
        </div>
        {D.examiner.map(([en, id]: string[], i: number) => (
          <div
            key={i}
            className="flex flex-col gap-0.5 border-t-2 border-dashed border-line pt-2.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-base leading-[22px] font-bold text-ink">
                {en}
              </span>
              <SpeakButton size={28} icon={13} text={en} />
            </div>
            <span className="text-[13px] text-ink-2">{id}</span>
          </div>
        ))}
      </Card>
    </>
  );
});

AskGuide.displayName = "AskGuide";

export default AskGuide;
