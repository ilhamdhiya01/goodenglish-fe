"use client";

import classNames from "classnames";
import React from "react";

import BankPractice from "@/components/features/grammar/BankPractice/BankPractice";
import DrillGrid from "@/components/features/grammar/DrillGrid/DrillGrid";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import SectionLabel from "@/components/ui/section-label";
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
import { useShellData } from "@/lib/hooks/useShellData";
import type { Item } from "@/lib/types/vocab.types";

const It = ({ t }: { t: string }) => (
  <span className="text-[15px] font-bold text-ink">{t}</span>
);

// The "✗" after a wrong pattern: same glyph, in the "wrong" red.
const X = () => <span className="font-black text-bad">✗</span>;

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
          <Card key={g.name}>
            <div className="flex flex-col gap-0.5">
              <span className="text-lg leading-6 font-extrabold text-ink">
                {g.name}
              </span>
              <span className="text-[13px] font-semibold text-ink-2">
                {g.desc}
              </span>
            </div>
            {!!CONJ_JOIN[g.name] && (
              <div className="flex flex-col gap-1.5 rounded-lg border-2 border-line bg-sunken px-3.5 py-3">
                <SectionLabel tone="green">DUA KALIMAT → SATU</SectionLabel>
                <span className="text-[13.5px] font-semibold text-ink-2">
                  {CONJ_JOIN[g.name][0]}{" "}
                  <span className="font-extrabold text-ink-3">+</span>{" "}
                  {CONJ_JOIN[g.name][1]}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] leading-[22px] font-bold text-ink">
                    {CONJ_JOIN[g.name][2]}
                  </span>
                  <SpeakButton
                    size={28}
                    icon={13}
                    text={CONJ_JOIN[g.name][2].split(" / ")[0]}
                  />
                </div>
                <span className="text-[13px] text-ink-2">
                  {CONJ_JOIN[g.name][3]}
                </span>
              </div>
            )}
            {g.items.map((c) => (
              <div
                key={c.en}
                className="flex flex-col gap-1 border-t-2 border-dashed border-line pt-2.5"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span
                    className={classNames(
                      "text-base font-extrabold",
                      c.core ? "text-accent-edge" : "text-ink",
                    )}
                  >
                    {c.en}
                  </span>
                  <span className="text-[13px] text-ink-2">{c.id}</span>
                  {c.core && (
                    <span className="rounded-[7px] bg-accent-tint px-1.5 py-px text-[11px] font-extrabold tracking-[0.06em] text-accent-edge">
                      KUASAI DULU
                    </span>
                  )}
                </div>
                <span className="text-[15px] leading-[22px] font-bold text-ink">
                  {c.ex}
                </span>
              </div>
            ))}
          </Card>
        ))}
      </div>

      <Card className="max-w-[760px] gap-2">
        <SectionLabel>KESALAHAN YANG SERING TERJADI</SectionLabel>
        <span className="text-sm leading-[22px] text-ink">
          <b>Although … but</b> <X /> → pakai salah satu saja:{" "}
          <It t="Although it's late, I'll come." />
        </span>
        <span className="text-sm leading-[22px] text-ink">
          <b>Even though … but</b> <X /> → sama:{" "}
          <It t="Even though he is rich, he is not happy." />
        </span>
        <span className="text-sm leading-[22px] text-ink">
          <b>Because … so</b> <X /> → pakai salah satu:{" "}
          <It t="I'm tired, so I'm going home." />
        </span>
        <span className="text-sm leading-[22px] text-ink">
          <b>Despite + kalimat</b> <X /> → despite diikuti kata benda / -ing:{" "}
          <It t="Despite being tired, she kept working." /> (bukan despite she
          was tired)
        </span>
        <span className="text-sm leading-[22px] text-ink">
          <b>However</b> di tengah kalimat tanpa tanda baca <X /> → taruh di
          awal kalimat baru: <It t="It's cheap. However, it's slow." />
        </span>
        <span className="text-sm leading-[22px] text-ink">
          <b>If … will</b> di bagian if <X /> →{" "}
          <It t="If it rains, we'll stay home." /> (bukan if it will rain)
        </span>
      </Card>

      {level !== "beginner" && (
        <Card pad="lg" className="gap-3">
          <div className="flex flex-col gap-1">
            <SectionLabel tone="green">
              ARTI SAMA, POLA BEDA · DIIKUTI APA?
            </SectionLabel>
            <span className="text-sm leading-[22px] font-semibold text-pretty text-ink-2">
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
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2.5 rounded-lg border-2 border-line bg-sunken px-3.5 py-3"
              >
                {[
                  [a, pa, ea],
                  [b, pb, eb],
                ].map(([w, p, x]) => (
                  <div key={w} className="flex min-w-0 flex-col gap-1">
                    <span className="text-[15px] font-extrabold text-ink">
                      {w}
                    </span>
                    <span className="text-[13px] font-bold text-accent-edge">
                      {p}
                    </span>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[15px] leading-[22px] font-bold text-ink">
                        {x}
                      </span>
                      <SpeakButton size={28} icon={13} text={x} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card pad="lg" className="gap-3">
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
