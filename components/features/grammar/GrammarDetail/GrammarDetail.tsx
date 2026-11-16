"use client";

import React from "react";

import DrillGrid from "@/components/features/grammar/DrillGrid/DrillGrid";
import Correction from "@/components/shared/patterns/correction";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import type { Detail } from "@/lib/types/grammar.types";

const Ex = ({ en, id }: { en: string; id: string }) => (
  <div className="flex flex-col gap-0.5">
    <div className="flex items-center gap-2">
      <span className="text-[15px] leading-[22px] font-bold text-ink">
        {en}
      </span>
      <SpeakButton size={28} icon={13} text={en} />
    </div>
    {!!id && <span className="text-[13px] text-ink-2">{id}</span>}
  </div>
);

// Blok "dibedah": label → ide → langkah bernomor → jebakan vs ringkasan →
// latihan. The first step is the one to start with, so its number is blue.
const GrammarDetail = React.memo(({ d }: { d: Detail }) => (
  <Card pad="lg" className="gap-5">
    <div className="flex flex-col gap-1">
      <SectionLabel>{d.label} · DIBEDAH</SectionLabel>
      <span className="text-xl leading-[26px] font-black text-ink">
        {d.title}
      </span>
    </div>
    <p className="m-0 max-w-[720px] text-[15px] leading-[22px] text-pretty text-ink-2">
      {d.idea}
    </p>

    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {d.steps.map((s, i) => (
        <li
          key={i}
          className="grid grid-cols-[auto_minmax(0,1fr)] gap-3.5 rounded-lg border-2 border-line px-4 py-3.5"
        >
          <span
            aria-hidden
            className={
              i === 0
                ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-black text-on-accent"
                : "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-chip text-sm font-black text-ink-2"
            }
          >
            {i + 1}
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-base leading-[22px] font-extrabold text-ink">
              {s.t}
            </span>
            <span className="text-sm leading-5 text-pretty text-ink-2">
              {s.b}
            </span>
            <div className="flex flex-col gap-2 border-t-2 border-dashed border-line pt-2.5">
              {s.ex.map(([en, id], j) => (
                <Ex key={j} en={en} id={id} />
              ))}
            </div>
          </div>
        </li>
      ))}
    </ol>

    <div className="grid gap-3.5 md:grid-cols-2">
      <Card tone="redBg" className="gap-3">
        <SectionLabel tone="red">✕ JEBAKAN</SectionLabel>
        {d.traps.map(([w, r, why], i) => (
          <Correction key={i} wrong={w} right={r} speak={r} why={why} />
        ))}
      </Card>
      <Card tone="greenBg" className="gap-2 self-start">
        <SectionLabel tone="ok">✓ RINGKASAN SATU KALIMAT</SectionLabel>
        <span className="text-base leading-[22px] font-bold text-pretty text-ink">
          {d.summary}
        </span>
      </Card>
    </div>

    <div className="border-t-2 border-dashed border-line pt-4">
      <DrillGrid label="LATIHAN · UBAH, UCAPKAN, LALU BUKA" rows={d.drill} />
    </div>
  </Card>
));

GrammarDetail.displayName = "GrammarDetail";

export default GrammarDetail;
