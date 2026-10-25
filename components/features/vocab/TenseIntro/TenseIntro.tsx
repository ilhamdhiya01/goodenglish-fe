import React from "react";

import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import { idOf } from "@/lib/content";
import type { Week } from "@/lib/types/vocab.types";

// Kepala minggu aktif: judul + topik, lalu dua kartu (fokus tense & contoh kalimat
// + kata sambung minggu ini).
const TenseIntro = React.memo(({ d }: { d: Week }) => {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <SectionLabel tone="green">
          MINGGU {d.week} · {d.items.length} ITEM
        </SectionLabel>
        <h2 className="m-0 text-[30px] font-bold tracking-[-0.015em]">
          {d.title}
        </h2>
        <span className="text-sm text-muted">{d.topic}</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3.5">
        <Card tone="ink" className="gap-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2.5">
            <SectionLabel>FOKUS TENSE</SectionLabel>
            <span className="text-lg font-bold">{d.tense?.name}</span>
          </div>
          <span className="text-sm leading-[1.5] text-ink-2">
            {d.tense?.use}
          </span>
          <div className="flex flex-col gap-1">
            {(d.tense?.form || []).map(([sign, text], i) => (
              <div key={i} className="flex flex-col gap-px">
                <div className="flex items-baseline gap-2.5">
                  <span className="min-w-[14px] shrink-0 font-mono text-[13px] font-medium whitespace-nowrap text-green">
                    {sign}
                  </span>
                  <span className="min-w-0 font-mono text-[13px] text-ink">
                    {text}
                  </span>
                </div>
                {!!idOf(text) && (
                  <span className="ml-6 text-xs text-faint">{idOf(text)}</span>
                )}
              </div>
            ))}
          </div>
          <span className="text-[12.5px] leading-[1.45] text-muted">
            <span className="font-semibold text-ink-2">Penanda waktu: </span>
            {d.tense?.markers}
          </span>
          <div className="border-t border-dashed border-line-2 pt-2.5 text-[13px] leading-[1.5] text-ink-2">
            {d.tense?.tip}
          </div>
        </Card>
        <Card tone="ink" className="gap-2.5">
          <SectionLabel>CONTOH TENSE</SectionLabel>
          {(d.tense?.ex || []).map((t, i) => (
            <div key={i} className="flex flex-col gap-px">
              <span className="font-serif text-[17px] leading-[1.4] italic">
                {t}
              </span>
              {!!idOf(t) && (
                <span className="text-[12.5px] text-faint">{idOf(t)}</span>
              )}
            </div>
          ))}
          <SectionLabel className="mt-1.5">
            KATA SAMBUNG MINGGU INI
          </SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {d.items
              .filter((i) => i[0] === "cj")
              .map((i) => (
                <span
                  key={i[1]}
                  className="rounded-full bg-green-bg2 px-2.5 py-1 text-[13px] font-semibold text-green-deep"
                >
                  {i[1]}
                  <span className="font-normal text-green-mid"> · {i[3]}</span>
                </span>
              ))}
          </div>
        </Card>
      </div>
    </section>
  );
});

TenseIntro.displayName = "TenseIntro";

export default TenseIntro;
