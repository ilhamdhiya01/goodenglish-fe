"use client";

import classNames from "classnames";
import React from "react";

import BankPractice from "@/components/features/grammar/BankPractice/BankPractice";
import DrillGrid from "@/components/features/grammar/DrillGrid/DrillGrid";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import SpeakButton from "@/components/ui/speak-button";
import {
  CONJ,
  CONJ_DRILL,
  CONJ_L,
  CONJ_PATTERN,
  CORE,
  CORE_L,
} from "@/const/conjunctions.constant";
import { CONJ_JOIN } from "@/lib/content";
import { speak } from "@/lib/helpers/speech.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import type { Item } from "@/lib/types/vocab.types";

const It = ({ t }: { t: string }) => (
  <i className="font-serif text-base">{t}</i>
);

// Sub-tab "Kata sambung": kelompok fungsi + pasangan arti-sama-pola-beda + latihan.
const ConjGuide = React.memo(() => {
  const { level, all } = useShellData();

  const cjMap: Record<string, Item> = {};
  all.forEach(({ it }) => {
    if (it[0] === "cj" && !cjMap[it[1]]) cjMap[it[1]] = it;
  });
  const groupsDef = level === "pre" ? CONJ : CONJ_L[level] || [];
  const coreMap = level === "pre" ? CORE : CORE_L[level] || {};
  const used = new Set<string>();
  const mk = (x: string) => ({
    en: x,
    id: cjMap[x][3],
    ex: cjMap[x][4],
    core: !!coreMap[x],
  });
  const groups = groupsDef
    .map(([name, desc, ws]) => ({
      name,
      desc,
      items: ws
        .filter((x) => cjMap[x])
        .map((x) => {
          used.add(x);
          return mk(x);
        }),
    }))
    .filter((g) => g.items.length);
  const rest = Object.keys(cjMap).filter((x) => !used.has(x));
  if (rest.length)
    groups.push({
      name: "Lainnya",
      desc: "Kata sambung lain di level ini",
      items: rest.map(mk),
    });

  return (
    <>
      <div className="flex max-w-[760px] flex-col gap-1.5">
        <PageHeading>Kata sambung menurut fungsinya</PageHeading>
        <Lead>
          Pilih kata sambung dari <b>apa yang mau kamu sampaikan</b>: menambah,
          membandingkan, memberi alasan, atau mengurutkan. Cukup kuasai satu per
          kelompok dulu (yang ditandai), baru tambah variasi.
        </Lead>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
        {groups.map((g) => (
          <Card key={g.name} tone="ink">
            <div className="flex flex-col gap-0.5">
              <span className="text-lg font-bold">{g.name}</span>
              <span className="text-[13px] text-muted">{g.desc}</span>
            </div>
            {!!CONJ_JOIN[g.name] && (
              <div className="flex flex-col gap-[5px] rounded-lg bg-green-bg px-3 py-2.5">
                <span className="font-mono text-[10.5px] tracking-[0.08em] text-green">
                  DUA KALIMAT → SATU
                </span>
                <span className="text-[13.5px] text-muted">
                  {CONJ_JOIN[g.name][0]} <span className="text-faint">+</span>{" "}
                  {CONJ_JOIN[g.name][1]}
                </span>
                <div className="flex items-start gap-2">
                  <span className="font-serif text-[15.5px] leading-[1.4] text-green-deep italic">
                    {CONJ_JOIN[g.name][2]}
                  </span>
                  <SpeakButton
                    size={22}
                    icon={11}
                    text={CONJ_JOIN[g.name][2].split(" / ")[0]}
                  />
                </div>
                <span className="text-[12.5px] text-green-mid">
                  {CONJ_JOIN[g.name][3]}
                </span>
              </div>
            )}
            {g.items.map((c) => (
              <div
                key={c.en}
                className="flex flex-col gap-[3px] border-t border-dashed border-line pt-2.5"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span
                    className={classNames(
                      "text-base font-bold",
                      c.core ? "text-green" : "text-ink",
                    )}
                  >
                    {c.en}
                  </span>
                  <span className="text-[13px] text-ink-3">{c.id}</span>
                  {c.core && (
                    <span className="rounded bg-green px-1.5 py-px font-mono text-[10.5px] text-card">
                      KUASAI DULU
                    </span>
                  )}
                </div>
                <span className="font-serif text-[15.5px] leading-[1.4] italic">
                  {c.ex}
                </span>
              </div>
            ))}
          </Card>
        ))}
      </div>

      <Card tone="ink" className="max-w-[760px] gap-2">
        <span className="font-mono text-xs tracking-[0.06em] text-muted">
          KESALAHAN YANG SERING TERJADI
        </span>
        <span className="text-sm leading-[1.55]">
          <b>Although … but</b> ✗ → pakai salah satu saja:{" "}
          <It t="Although it's late, I'll come." />
        </span>
        <span className="text-sm leading-[1.55]">
          <b>Even though … but</b> ✗ → sama:{" "}
          <It t="Even though he is rich, he is not happy." />
        </span>
        <span className="text-sm leading-[1.55]">
          <b>Because … so</b> ✗ → pakai salah satu:{" "}
          <It t="I'm tired, so I'm going home." />
        </span>
        <span className="text-sm leading-[1.55]">
          <b>Despite + kalimat</b> ✗ → despite diikuti kata benda / -ing:{" "}
          <It t="Despite being tired, she kept working." /> (bukan despite she
          was tired)
        </span>
        <span className="text-sm leading-[1.55]">
          <b>However</b> di tengah kalimat tanpa tanda baca ✗ → taruh di awal
          kalimat baru: <It t="It's cheap. However, it's slow." />
        </span>
        <span className="text-sm leading-[1.55]">
          <b>If … will</b> di bagian if ✗ →{" "}
          <It t="If it rains, we'll stay home." /> (bukan if it will rain)
        </span>
      </Card>

      {level !== "beginner" && (
        <Card tone="ink" pad="lg" className="gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs tracking-[0.06em] text-green">
              ARTI SAMA, POLA BEDA · DIIKUTI APA?
            </span>
            <span className="text-sm leading-[1.5] text-pretty text-ink-2">
              Pasangan ini artinya mirip, tapi yang kiri diikuti{" "}
              <b>kalimat lengkap</b> (ada subjek + kata kerja), yang kanan
              diikuti <b>kata benda / -ing</b>. Ini sumber salah paling sering
              setelah kata sambung dobel.
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-2.5">
            {CONJ_PATTERN.map(([a, pa, ea, b, pb, eb]) => (
              <div
                key={a}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2.5 rounded-lg bg-sand px-3.5 py-3"
              >
                {[
                  [a, pa, ea],
                  [b, pb, eb],
                ].map(([w, p, x]) => (
                  <div key={w} className="flex min-w-0 flex-col gap-1">
                    <span className="text-[15px] font-bold">{w}</span>
                    <span className="font-mono text-[11.5px] text-green">
                      {p}
                    </span>
                    <div className="flex items-start gap-1.5">
                      <span className="font-serif text-[15px] leading-[1.35] italic">
                        {x}
                      </span>
                      <SpeakButton size={22} icon={11} text={x} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card tone="ink" pad="lg" className="gap-3">
        <DrillGrid
          label="LATIHAN · GABUNGKAN DUA KALIMAT, UCAPKAN, LALU BUKA"
          rows={level === "beginner" ? CONJ_DRILL.slice(0, 2) : CONJ_DRILL}
        />
      </Card>
      <BankPractice topic="conj" />
    </>
  );
});

ConjGuide.displayName = "ConjGuide";

export default ConjGuide;
