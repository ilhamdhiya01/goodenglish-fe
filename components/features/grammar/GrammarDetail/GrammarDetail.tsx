"use client";

import React from "react";

import DrillGrid from "@/components/features/grammar/DrillGrid/DrillGrid";
import Card from "@/components/ui/card";
import SpeakButton from "@/components/ui/speak-button";
import { speak } from "@/lib/helpers/speech.helper";
import type { Detail } from "@/lib/types/grammar.types";

const Ex = ({ en, id }: { en: string; id: string }) => {
  return (
    <div className="flex flex-col gap-px">
      <div className="flex items-center gap-2">
        <span className="font-serif text-[16.5px] leading-[1.35] italic">
          {en}
        </span>
        <SpeakButton size={22} icon={11} text={en} />
      </div>
      {!!id && <span className="text-[12.5px] text-faint">{id}</span>}
    </div>
  );
};

// Blok "dibedah": label → ide → langkah bernomor → jebakan vs ringkasan → latihan.
const GrammarDetail = React.memo(({ d }: { d: Detail }) => {
  return (
    <Card tone="ink" pad="lg" className="gap-5 rounded-xl">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs tracking-[0.06em] text-green">
          {d.label} · DIBEDAH
        </span>
        <span className="text-[26px] leading-[1.2] font-bold tracking-[-0.01em]">
          {d.title}
        </span>
      </div>
      <p className="m-0 max-w-[760px] text-[15px] leading-[1.55] text-pretty text-ink-2">
        {d.idea}
      </p>

      <div className="flex flex-col gap-3">
        {d.steps.map((s, i) => (
          <div
            key={i}
            className="grid grid-cols-[auto_minmax(0,1fr)] gap-3.5 rounded-[10px] border border-line px-4 py-3.5"
          >
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green font-mono text-[13px] font-bold text-card">
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-base leading-[1.3] font-bold">{s.t}</span>
              <span className="text-sm leading-[1.55] text-pretty text-ink-2">
                {s.b}
              </span>
              <div className="flex flex-col gap-1.5 border-t border-dashed border-line pt-2">
                {s.ex.map(([en, id], j) => (
                  <Ex key={j} en={en} id={id} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
        <div className="flex flex-col gap-2.5 rounded-[10px] border border-red-line bg-red-bg px-4 py-3.5">
          <span className="font-mono text-xs tracking-[0.06em] text-red">
            JEBAKAN
          </span>
          {d.traps.map(([w, r, why], i) => (
            <div
              key={i}
              className="flex flex-col gap-0.5 border-t border-dashed border-red-line pt-2"
            >
              <span className="text-sm text-red line-through decoration-red/50">
                {w}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-green">
                  {r}
                </span>
                <SpeakButton size={22} icon={11} onClick={() => speak(r)} />
              </div>
              <span className="text-[12.5px] text-muted">{why}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 self-start rounded-[10px] border border-green-line bg-green-bg px-4 py-3.5">
          <span className="font-mono text-xs tracking-[0.06em] text-green">
            RINGKASAN SATU KALIMAT
          </span>
          <span className="text-base leading-[1.5] font-semibold text-pretty text-green-deep">
            {d.summary}
          </span>
        </div>
      </div>

      <div className="border-t border-dashed border-line pt-4">
        <DrillGrid label="LATIHAN · UBAH, UCAPKAN, LALU BUKA" rows={d.drill} />
      </div>
    </Card>
  );
});

GrammarDetail.displayName = "GrammarDetail";

export default GrammarDetail;
