"use client";

import classNames from "classnames";
import React, { useState } from "react";

import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import Pill from "@/components/ui/pill";
import SpeakButton from "@/components/ui/speak-button";
import { LEVELS } from "@/const/levels.constant";
import { VOCAB_SCEN, VOCAB_SCEN_KEY } from "@/lib/content";
import { speak, speakAll } from "@/lib/helpers/speech.helper";
import type { Scenario } from "@/lib/types/scenario.types";
import { useLevelStore } from "@/stores/useLevelStore";

const SC = VOCAB_SCEN as Scenario[];
const isYou = (r: string) => r === "You" || r === "A";

// Halaman Skenario: dialog 8–12 baris + frasa kunci + variasi jawaban.
const ScenarioPage = React.memo(() => {
  const level = useLevelStore((s) => s.level);

  const first = SC.find((x) => x.level === level) || SC[0];
  const [id, setId] = useState(first ? first.id : "standup");
  const [solo, setSolo] = useState(false);
  const [showId, setShowId] = useState(true);
  const [showEn, setShowEn] = useState(true);
  const [revealed, setRevealed] = useState<Record<number, 1>>({});

  const cur = SC.find((x) => x.id === id) ||
    SC[0] || { id: "", level: "", title: "", where: "", lines: [] };
  const key = VOCAB_SCEN_KEY[id];
  const byLevel = [level]
    .concat(LEVELS.map((l) => l[0]).filter((l) => l !== level))
    .map((lv) => ({
      lv,
      name: (LEVELS.find((l) => l[0] === lv) || [])[1] || lv,
      items: SC.filter((x) => x.level === lv),
    }))
    .filter((g) => g.items.length);

  return (
    <section className="flex flex-col gap-5.5">
      <div className="flex max-w-[760px] flex-col gap-1.5">
        <PageHeading>Skenario percakapan</PageHeading>
        <Lead>
          Satu situasi utuh, 8–12 kalimat berurutan. Latih dengan menutup
          terjemahan, baca peranmu keras-keras, lalu coba tanpa melihat teks.
          Skenario level lain tetap bisa dibuka.
        </Lead>
      </div>

      <div className="flex flex-col gap-2">
        {byLevel.map((g, gi) => (
          <div
            key={g.lv}
            className={classNames(
              "flex flex-wrap items-center gap-2",
              gi !== 0 && "opacity-80",
            )}
          >
            <span
              className={classNames(
                "min-w-[130px] font-mono text-[11px] tracking-[0.08em]",
                gi === 0 ? "text-green" : "text-faint",
              )}
            >
              {String(g.name).toUpperCase()}
              {gi === 0 ? " · LEVELMU" : ""}
            </span>
            {g.items.map((x) => (
              <Pill
                key={x.id}
                size="sm"
                on={x.id === cur.id}
                onClick={() => {
                  setId(x.id);
                  setRevealed({});
                }}
              >
                {x.title}
              </Pill>
            ))}
          </div>
        ))}
      </div>

      <Card tone="ink" pad="lg" className="max-w-[860px] gap-4 rounded-xl">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[22px] font-bold">{cur.title}</span>
            <span className="text-[13px] text-muted">{cur.where}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill size="sm" on={showId} onClick={() => setShowId(!showId)}>
              Terjemahan
            </Pill>
            <Pill
              size="sm"
              on={!showEn && !solo}
              onClick={() => {
                setShowEn(!showEn);
                setRevealed({});
                setSolo(false);
              }}
            >
              Sembunyikan baris &quot;You&quot;
            </Pill>
            <Pill
              size="sm"
              tone="green"
              on={solo}
              title="Baris lawan bicara diputar, kamu jawab sendiri, lalu buka"
              onClick={() => {
                setSolo(!solo);
                setShowEn(solo);
                setRevealed({});
              }}
            >
              Jawab sendiri
            </Pill>
            <button
              type="button"
              onClick={() => speakAll(cur.lines.map((l) => l[1]))}
              className="cursor-pointer rounded-full border-[1.5px] border-green bg-transparent px-3 py-1.5 font-sans text-[12.5px] font-semibold text-green transition-colors hover:bg-green-bg"
            >
              Putar semua
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {cur.lines.map((l, i) => {
            const you = isYou(l[0]);
            const hidden = (!showEn || solo) && you && !revealed[i];
            const prev = i > 0 ? cur.lines[i - 1] : null;
            return (
              <div
                key={i}
                className={classNames(
                  "grid grid-cols-[64px_minmax(0,1fr)_auto] items-start gap-3 rounded-lg px-3 py-2.5",
                  you && "bg-green-bg",
                )}
              >
                <span
                  className={classNames(
                    "pt-[3px] font-mono text-[11.5px] font-semibold",
                    you ? "text-green" : "text-muted",
                  )}
                >
                  {l[0]}
                </span>
                <div className="flex min-w-0 flex-col gap-[3px]">
                  {!hidden && (
                    <span className="text-base leading-[1.45] text-ink">
                      {l[1]}
                    </span>
                  )}
                  {hidden && (
                    <div className="flex flex-wrap items-center gap-3">
                      {solo && prev && !isYou(prev[0]) && (
                        <button
                          type="button"
                          onClick={() => speak(prev[1])}
                          className="inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 font-sans text-[13px] text-ink"
                        >
                          <SpeakButton
                            nested
                            size={22}
                            icon={11}
                            text={prev[1]}
                          />
                          dengar lawan bicara
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setRevealed((r) => ({ ...r, [i]: 1 }))}
                        className="cursor-pointer border-0 border-b-[1.5px] border-dotted border-green bg-transparent p-0 font-sans text-sm text-green"
                      >
                        {solo
                          ? "Jawab dengan suaramu, lalu buka"
                          : "Coba ucapkan dulu, lalu klik"}
                      </button>
                    </div>
                  )}
                  {showId && (!hidden || !solo) && (
                    <span className="text-[13px] text-muted">{l[2]}</span>
                  )}
                </div>
                <SpeakButton text={l[1]} />
              </div>
            );
          })}
        </div>
      </Card>

      {key && (
        <div className="grid max-w-[860px] grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
          <Card tone="ink">
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-xs tracking-[0.06em] text-green">
                FRASA KUNCI · PAKAI ULANG DI SITUASI LAIN
              </span>
              <span className="text-[13px] text-muted">
                Hafalkan ini, bukan naskahnya. Polanya yang dibawa ke percakapan
                nyata.
              </span>
            </div>
            {key.phrases.map(([en, id2, note], i) => (
              <div
                key={i}
                className="flex flex-col gap-[3px] border-t border-dashed border-line pt-2.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-[17px] italic">{en}</span>
                  <SpeakButton size={22} icon={11} text={en} />
                  <span className="text-[13px] text-ink-3">{id2}</span>
                </div>
                <span className="text-[12.5px] text-muted">{note}</span>
              </div>
            ))}
          </Card>
          <Card>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-xs tracking-[0.06em] text-muted">
                KALAU DIA BILANG … KAMU JAWAB …
              </span>
              <span className="text-[13px] text-muted">
                Percakapan nyata tidak selalu sesuai naskah. Latih variasinya.
              </span>
            </div>
            {key.variants.map(([they, you], i) => (
              <div
                key={i}
                className="flex flex-col gap-1 border-t border-dashed border-line pt-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="min-w-9 font-mono text-[11px] text-muted">
                    DIA
                  </span>
                  <span className="text-[14.5px] text-ink-2">{they}</span>
                  <SpeakButton size={22} icon={11} text={they} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="min-w-9 font-mono text-[11px] text-green">
                    KAMU
                  </span>
                  <span className="font-serif text-base text-ink italic">
                    {you}
                  </span>
                  <SpeakButton size={22} icon={11} text={you} />
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </section>
  );
});

ScenarioPage.displayName = "ScenarioPage";

export default ScenarioPage;
