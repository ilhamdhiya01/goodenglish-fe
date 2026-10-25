"use client";

import classNames from "classnames";
import React, { useState } from "react";

import BankPractice from "@/components/features/grammar/BankPractice/BankPractice";
import GrammarDetail from "@/components/features/grammar/GrammarDetail/GrammarDetail";
import Rich from "@/components/shared/rich";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import SpeakButton from "@/components/ui/speak-button";
import {
  CORE_TENSES,
  DETAIL,
  PRESENT_EXTRA,
  TENSE_TIPS,
} from "@/const/grammar.constant";
import { idOf } from "@/lib/content";
import { formulaOf } from "@/lib/helpers/grammar-detail.helper";
import { speak } from "@/lib/helpers/speech.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import type { Tense } from "@/lib/types/vocab.types";

const COL =
  "minmax(140px,1fr) minmax(180px,1.4fr) minmax(200px,1.6fr) minmax(200px,1.6fr)";

// Sub-tab "Memilih tense": 3 pertanyaan → detail → tabel semua tense level ini.
const TenseGuide = React.memo(() => {
  const { level, data } = useShellData();
  const [showAll, setShowAll] = useState(false);

  const core = CORE_TENSES[level] || CORE_TENSES.pre;
  const isCore = (name: string) =>
    core.some((c) => name.toLowerCase().includes(c));
  const tips = TENSE_TIPS[level] || TENSE_TIPS.pre;
  const toRow = (week: string, t: Tense, exId: string[] = []) => ({
    week,
    name: t.name,
    use: t.use,
    form: t.form.map((f) => f[0] + "  " + f[1]).join("\n"),
    exList: t.ex,
    exId,
  });
  const rows = Object.keys(data.V)
    .sort((a, b) => +a - +b)
    .filter((w) => data.V[w].tense)
    .map((w) => toRow(w, data.V[w].tense!));
  // Present tense yang belum ada di level ini disisipkan tepat setelah pasangannya
  // (simple → continuous → perfect → perfect continuous); kalau pasangannya tak ada, taruh di akhir.
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  PRESENT_EXTRA.forEach((t, i) => {
    if (rows.some((r) => same(r.name, t.name))) return;
    const prev = i === 0 ? "Present Simple" : PRESENT_EXTRA[i - 1].name;
    const at = rows.findIndex((r) => same(r.name, prev));
    rows.splice(at < 0 ? rows.length : at + 1, 0, toRow("", t, t.exId));
  });

  return (
    <>
      <div className="flex max-w-[760px] flex-col gap-1.5">
        <PageHeading>Memilih tense dalam 3 pertanyaan</PageHeading>
        <Lead>
          Saat mau bicara, jangan pikirkan nama tense. Tanya diri sendiri tiga
          hal ini, lalu pakai polanya.
        </Lead>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
        {tips.map(([h, b]) => (
          <Card key={h} tone="ink" className="gap-2 p-5">
            <span className="font-mono text-[13px] text-green">{h}</span>
            <span className="text-[15px] leading-[1.5]">
              <Rich text={b} boldClassName="" />
            </span>
          </Card>
        ))}
      </div>

      <GrammarDetail d={DETAIL.tense} />

      <Card tone="green" className="gap-2">
        <span className="font-mono text-xs tracking-[0.06em] text-green">
          CUKUP {core.length} TENSE INI UNTUK ±90% PERCAKAPAN
        </span>
        <span className="text-[15px] leading-[1.55] text-pretty text-ink">
          Kuasai yang ditandai hijau di tabel sampai otomatis:{" "}
          <b>
            {rows
              .filter((r) => isCore(r.name))
              .map((r) => r.name)
              .join(" · ") || core.join(" · ")}
          </b>
          . Tense lain pelajari saat sudah lancar — bukan karena tidak penting,
          tapi karena jarang dipakai dalam obrolan dan hanya menambah beban di
          awal.
        </span>
      </Card>

      <div className="overflow-auto rounded-[10px] border-[1.5px] border-ink bg-card">
        <div className="min-w-[720px]">
          <div
            className="grid border-b-[1.5px] border-ink bg-hairline font-mono text-xs tracking-[0.05em] text-muted"
            style={{ gridTemplateColumns: COL }}
          >
            <span className="px-4 py-2.5">TENSE</span>
            <span className="px-4 py-2.5">DIPAKAI UNTUK</span>
            <span className="px-4 py-2.5">POLA</span>
            <span className="px-4 py-2.5">CONTOH</span>
          </div>
          {rows
            .filter((r) => showAll || isCore(r.name) || !r.week)
            .map((t) => {
              const c = isCore(t.name);
              return (
                <div
                  key={t.week || t.name}
                  className={classNames(
                    "grid border-b border-track text-sm leading-[1.5]",
                    c ? "bg-card" : "bg-[#faf8f3]",
                  )}
                  style={{ gridTemplateColumns: COL }}
                >
                  <span
                    className={classNames(
                      "border-l-[3px] px-4 py-3.5 font-bold",
                      c ? "border-green" : "border-transparent",
                    )}
                  >
                    {t.name}
                    <span className="block font-mono text-[11px] font-normal text-muted">
                      {t.week ? "MINGGU " + t.week : "TAMBAHAN"}
                      {c ? " · INTI" : ""}
                    </span>
                  </span>
                  <span className="px-4 py-3.5 text-ink-2">{t.use}</span>
                  <div className="flex flex-col gap-2 px-4 py-3.5">
                    {(() => {
                      const f = formulaOf(t.name);
                      const low = t.name.toLowerCase();
                      return f ? (
                        <div className="flex flex-col gap-[3px] rounded-md bg-green-bg px-[9px] py-[7px]">
                          {f.map((x, k) => (
                            <span
                              key={k}
                              className="font-mono text-xs font-semibold text-green-deep"
                            >
                              <span className="mr-1.5 text-faint">
                                {f.length > 1 &&
                                f.length <= 3 &&
                                !low.includes("conditional") &&
                                !low.includes("wish") &&
                                !low.includes("comparative")
                                  ? ["+", "−", "?"][k]
                                  : "·"}
                              </span>
                              {x}
                            </span>
                          ))}
                        </div>
                      ) : null;
                    })()}
                    <span className="font-mono text-[12.5px] whitespace-pre-line">
                      {t.form}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 px-4 py-3.5">
                    {t.exList.map((e, i) => (
                      <div key={i} className="flex flex-col gap-px">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-base italic">
                            {e}
                          </span>
                          <SpeakButton
                            size={22}
                            icon={11}
                            onClick={() => speak(e)}
                          />
                        </div>
                        {!!(idOf(e) || t.exId[i]) && (
                          <span className="text-xs text-faint">
                            {idOf(e) || t.exId[i]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          {rows.some((r) => !isCore(r.name) && r.week) && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="w-full cursor-pointer border-none bg-transparent px-4 py-3 text-center font-sans text-[13.5px] font-semibold text-green"
            >
              {showAll
                ? "Sembunyikan tense lanjutan ↑"
                : "Tampilkan " +
                  rows.filter((r) => !isCore(r.name) && r.week).length +
                  " tense lanjutan ↓"}
            </button>
          )}
        </div>
      </div>
      <BankPractice topic="tense" />
    </>
  );
});

TenseGuide.displayName = "TenseGuide";

export default TenseGuide;
