"use client";

import classNames from "classnames";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import SpeakButton from "@/components/ui/speak-button";
import { LEVELS } from "@/const/levels.constant";
import { GAPS } from "@/const/srs.constant";
import { typeDef } from "@/const/vocab-types.constant";
import { hasNote, idOf, noteOf } from "@/lib/content";
import { resolveItemKey } from "@/lib/helpers/derived.helper";
import { useJumpToWord } from "@/lib/hooks/useJumpToWord";
import { useNotes } from "@/lib/hooks/useNotes";
import { useShellData } from "@/lib/hooks/useShellData";
import { useProgressStore } from "@/stores/useProgressStore";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

const Stat = ({
  label,
  n,
  dark,
}: {
  label: string;
  n: number;
  dark?: boolean;
}) => {
  return (
    <div
      className={classNames(
        "flex flex-[1_1_160px] flex-col gap-1 rounded-[10px] border-[1.5px] bg-card px-[18px] py-4",
        dark ? "border-ink" : "border-line",
      )}
    >
      <span className="font-mono text-[11px] tracking-[0.06em] text-muted">
        {label}
      </span>
      <span className="text-3xl font-bold">{n}</span>
    </div>
  );
};

// Halaman "Ulang hari ini": satu kartu SRS per kata yang jatuh tempo.
const ReviewPage = React.memo(() => {
  const { dueKeys, scheduled, doneToday, allLevels, srs, own } = useShellData();
  const bumpSrs = useProgressStore((s) => s.bumpSrs);
  const flip = useVocabUiStore((s) => s.flip);
  const { jumpToWord } = useJumpToWord();
  const router = useRouter();

  const rvKey = dueKeys[0];
  const [revealed, setRevealed] = useState(false);
  // Reset saat kata berganti atau mode flip dibalik (seperti rvRevealed versi lama).
  // Done during render (React's "reset state when a value changes" pattern)
  // instead of in an effect, so the old card never flashes revealed.
  const [revealedFor, setRevealedFor] = useState(`${rvKey}|${flip}`);
  if (revealedFor !== `${rvKey}|${flip}`) {
    setRevealedFor(`${rvKey}|${flip}`);
    setRevealed(false);
  }

  const item = rvKey ? resolveItemKey(allLevels, rvKey) : null;
  const cur = rvKey ? srs[rvKey] || { st: 0, due: 0 } : { st: 0, due: 0 };
  const notesReady = useNotes(!!item && hasNote(item.it[1]));
  const note = item && notesReady ? noteOf(item.it[1]) : null;
  const halfGap = Math.max(1, Math.round(GAPS[cur.st] / 2));
  const lvName = item
    ? (LEVELS.find((l) => l[0] === item.lid) || [])[1] || ""
    : "";

  return (
    <section className="flex max-w-[820px] flex-col gap-5.5">
      <div className="flex flex-col gap-1.5">
        <PageHeading>Ulang hari ini</PageHeading>
        <Lead>
          Kata yang kamu tandai hafal dijadwalkan ulang: 1 → 3 → 7 → 14 → 30 →
          60 hari. Jawab jujur. Kalau lupa, jadwalnya mundur ke awal. Ini yang
          membuat 2.000 kata benar-benar menempel.
        </Lead>
      </div>
      <div className="flex flex-wrap gap-3.5">
        <Stat label="JATUH TEMPO" n={dueKeys.length} dark />
        <Stat label="SELESAI HARI INI" n={doneToday} />
        <Stat label="DALAM JADWAL" n={scheduled} />
      </div>

      {item && (
        <Card tone="ink" pad="lg" className="gap-4 rounded-xl">
          <div className="flex flex-wrap justify-between gap-2.5">
            <span className="font-mono text-[11px] tracking-[0.06em] text-muted">
              {lvName.toUpperCase()} · MINGGU {item.w} ·{" "}
              {typeDef(item.it[0]).label.toUpperCase()}
            </span>
            <span className="font-mono text-[11px] text-faint">
              tahap {cur.st + 1}/{GAPS.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-4xl font-bold tracking-[-0.02em]">
              {flip ? item.it[3] : item.it[1]}
            </span>
            {!flip && <SpeakButton size={30} icon={14} text={item.it[1]} />}
          </div>
          {revealed ? (
            <>
              <div className="flex flex-col gap-2 border-t border-dashed border-line pt-3.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[17px] text-ink">
                    {flip ? item.it[1] : item.it[3]}
                  </span>
                  {flip && <SpeakButton text={item.it[1]} />}
                </div>
                <span className="font-serif text-lg text-ink-2 italic">
                  {item.it[4]}
                </span>
                {!!idOf(item.it[4]) && (
                  <span className="-mt-1 text-[13.5px] text-muted">
                    {idOf(item.it[4])}
                  </span>
                )}
                {!!own[rvKey] && (
                  <span className="text-[13.5px] text-muted">
                    <span className="font-semibold text-green">
                      Kalimatmu:{" "}
                    </span>
                    {own[rvKey]}
                  </span>
                )}
              </div>
              {note && (
                <div className="flex flex-col gap-2 rounded-lg border border-line bg-sand px-3.5 py-3">
                  <span className="font-mono text-[11px] tracking-[0.08em] text-green">
                    INGAT LAGI
                  </span>
                  <span className="text-sm leading-[1.5] text-ink">
                    {note.core}
                  </span>
                  {!!note.traps?.length && (
                    <span className="text-[13.5px]">
                      <span className="text-red line-through">
                        {note.traps[0][0]}
                      </span>{" "}
                      <span className="font-semibold text-green">
                        ✓ {note.traps[0][1]}
                      </span>
                    </span>
                  )}
                  {!!note.see?.length && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10.5px] text-muted">
                        LIHAT JUGA
                      </span>
                      {note.see.map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => jumpToWord(s)}
                          className="cursor-pointer rounded-full border border-line-2 bg-card px-[9px] py-0.5 font-sans text-[12.5px] text-green hover:border-green"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => bumpSrs(rvKey, "forgot")}
                  className="flex-[1_1_140px] cursor-pointer rounded-lg border-[1.5px] border-red px-4 py-3 text-center font-sans font-semibold text-red transition-colors hover:bg-red-bg"
                >
                  Lupa · ulang besok
                </button>
                <button
                  type="button"
                  onClick={() => bumpSrs(rvKey, "hard")}
                  className="flex-[1_1_140px] cursor-pointer rounded-lg border-[1.5px] border-ink px-4 py-3 text-center font-sans font-semibold text-ink transition-colors hover:bg-sand"
                >
                  Ragu · ulang {halfGap} hari
                </button>
                <button
                  type="button"
                  onClick={() => bumpSrs(rvKey, "good")}
                  className="flex-[1_1_140px] cursor-pointer rounded-lg border-[1.5px] border-green bg-green px-4 py-3 text-center font-sans font-semibold text-card transition-colors hover:bg-green-deep"
                >
                  Ingat · {GAPS[Math.min(cur.st + 1, GAPS.length - 1)]} hari
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-sm text-muted">
                {flip
                  ? "Ucapkan kata Inggrisnya dan satu kalimat, lalu buka."
                  : "Ucapkan artinya dan satu kalimat, lalu buka."}
              </span>
              <Button
                variant="dark"
                className="self-start px-[22px] py-3"
                onClick={() => setRevealed(true)}
              >
                Buka jawaban
              </Button>
            </>
          )}
        </Card>
      )}

      {!item && (
        <div className="flex flex-col items-center gap-3.5 rounded-xl border-[1.5px] border-dashed border-line-2 px-6 py-9 text-center text-[15px] leading-[1.5] text-muted">
          <span>
            {scheduled
              ? "Tidak ada yang jatuh tempo hari ini. Lanjut belajar kata baru."
              : "Belum ada kata terjadwal. Tandai 5 kata sebagai hafal hari ini, dan kata itu akan muncul di sini besok."}
          </span>
          <Button variant="dark" onClick={() => router.push("/vocab")}>
            Ke Kosakata minggu ini →
          </Button>
        </div>
      )}
    </section>
  );
});

ReviewPage.displayName = "ReviewPage";

export default ReviewPage;
