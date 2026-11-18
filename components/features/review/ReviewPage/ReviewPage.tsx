"use client";

import classNames from "classnames";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import Jalak from "@/components/brand/Jalak";
import Correction from "@/components/shared/patterns/correction";
import TargetMark from "@/components/shared/patterns/target-mark";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import { LEVELS } from "@/const/levels.constant";
import { GAPS } from "@/const/srs.constant";
import { typeDef } from "@/const/vocab-types.constant";
import { hasNote, idOf, noteOf } from "@/lib/content";
import { resolveItemKey } from "@/lib/helpers/derived.helper";
import { flatten } from "@/lib/helpers/level-data.helper";
import { findTarget } from "@/lib/helpers/target.helper";
import { formsOf } from "@/lib/helpers/verb-forms.helper";
import { useJumpToWord } from "@/lib/hooks/useJumpToWord";
import { useNotes } from "@/lib/hooks/useNotes";
import { useShellData } from "@/lib/hooks/useShellData";
import type { LevelId } from "@/lib/types/session.types";
import { useAccessStore } from "@/stores/useAccessStore";
import { useMistakeStore } from "@/stores/useMistakeStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

import MistakeReviewCard from "../MistakeReviewCard";

// A read-only count shaped like a Pill ("24 jatuh tempo").
const Stat = ({ n, label }: { n: number; label: string }) => (
  <span className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full border-2 border-line bg-surface px-3.5 text-[13px] font-extrabold text-ink-2">
    <span className="text-ink tabular-nums">{n}</span> {label}
  </span>
);

const SHORTCUTS = [
  ["Spasi", "Buka jawaban"],
  ["1", "Lupa"],
  ["2", "Ragu"],
  ["3", "Ingat"],
] as const;

// Keys that would also act on whatever has focus (a button, a field) are
// left alone, and nothing happens while a dialog or the AI panel is open.
const ignoreKey = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return true;
  const t = e.target as HTMLElement | null;
  if (t?.closest("input, textarea, select, [contenteditable='true']"))
    return true;
  if (e.key === " " && t?.closest("button, a, [role='button']")) return true;
  return !!document.querySelector("[aria-modal='true'], aside[role='dialog']");
};

// Halaman "Ulang hari ini": satu kartu SRS per kata yang jatuh tempo. Spasi
// membuka jawaban, 1 / 2 / 3 menjawab Lupa / Ragu / Ingat.
const ReviewPage = React.memo(() => {
  const { dueKeys, dueMistakes, scheduled, doneToday, allLevels, srs, own } =
    useShellData();
  const bumpSrs = useProgressStore((s) => s.bumpSrs);
  const gradeMistake = useMistakeStore((s) => s.grade);
  const reviewOn = useMistakeStore((s) => s.reviewOn);
  const setReviewOn = useMistakeStore((s) => s.setReviewOn);
  const allowed = useAccessStore((s) => s.session?.levels);
  // Every word in the levels this token may open (bundled + admin + Kataku).
  const totalWords = useMemo(
    () =>
      LEVELS.filter(([id]) => allowed?.includes(id as LevelId)).reduce(
        (n, [id]) => n + flatten(allLevels[id].V).length,
        0,
      ),
    [allLevels, allowed],
  );
  const flip = useVocabUiStore((s) => s.flip);
  const { jumpToWord } = useJumpToWord();
  const router = useRouter();

  // The first due card that still exists: a deleted Kataku/personal card
  // must not block the ones behind it.
  const rvKey = useMemo(
    () => dueKeys.find((k) => resolveItemKey(allLevels, k)) ?? "",
    [dueKeys, allLevels],
  );
  // Word and mistake cards take turns (by how many were answered today);
  // when one kind runs out, the other continues.
  const nextMistake = dueMistakes[0] ?? null;
  const mistake =
    nextMistake && (!rvKey || doneToday % 2 === 1) ? nextMistake : null;
  const cardId = mistake ? `m:${mistake.id}` : `w:${rvKey}`;
  const [revealed, setRevealed] = useState(false);
  // Reset saat kartu berganti atau mode flip dibalik (seperti rvRevealed versi lama).
  // Done during render (React's "reset state when a value changes" pattern)
  // instead of in an effect, so the old card never flashes revealed.
  const [revealedFor, setRevealedFor] = useState(`${cardId}|${flip}`);
  if (revealedFor !== `${cardId}|${flip}`) {
    setRevealedFor(`${cardId}|${flip}`);
    setRevealed(false);
  }

  const item = rvKey && !mistake ? resolveItemKey(allLevels, rvKey) : null;
  const cur = mistake
    ? mistake.srs
    : rvKey
      ? srs[rvKey] || { st: 0, due: 0 }
      : { st: 0, due: 0 };
  const notesReady = useNotes(!!item && hasNote(item.it[1]));
  const note = item && notesReady ? noteOf(item.it[1]) : null;
  const halfGap = Math.max(1, Math.round(GAPS[cur.st] / 2));
  const lvName = item
    ? (LEVELS.find((l) => l[0] === item.lid) || [])[1] || ""
    : "";

  const answers = [
    { how: "forgot" as const, key: "1", title: "✕ Lupa", sub: "ulang besok" },
    {
      how: "hard" as const,
      key: "2",
      title: "Ragu",
      sub: `ulang ${halfGap} hari`,
    },
    {
      how: "good" as const,
      key: "3",
      title: "✓ Ingat",
      sub: `${GAPS[Math.min(cur.st + 1, GAPS.length - 1)]} hari`,
    },
  ];

  const answer = (how: (typeof answers)[number]["how"]) => {
    if (mistake) gradeMistake(mistake.id, how);
    else if (rvKey) bumpSrs(rvKey, how);
  };

  // Space opens the answer; 1 / 2 / 3 = Lupa / Ragu / Ingat once it's open.
  useEffect(() => {
    if (!item && !mistake) return;
    const onKey = (e: KeyboardEvent) => {
      if (ignoreKey(e)) return;
      if (e.key === " " && !revealed) {
        e.preventDefault();
        setRevealed(true);
        return;
      }
      const a = revealed && answers.find((x) => x.key === e.key);
      if (a) {
        e.preventDefault();
        answer(a.how);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const queue = [
    ...dueKeys
      .filter((k) => mistake || k !== rvKey)
      .map((k) => {
        const it = resolveItemKey(allLevels, k);
        return (
          it && {
            k,
            label: flip ? it.it[3] : it.it[1],
            st: srs[k]?.st ?? 0,
          }
        );
      })
      .filter((x) => !!x)
      .slice(0, 5),
    ...dueMistakes
      .filter((m) => m !== mistake)
      .slice(0, 5)
      .map((m) => ({ k: m.id, label: "✕ " + m.wrong, st: m.srs.st })),
  ].slice(0, 6);

  // Lupa / Ragu / Ingat: the same buttons for word and mistake cards.
  const answerButtons = (
    /* On a phone the three answers stay above the bottom nav. */
    <div className="grid grid-cols-3 gap-2 max-md:sticky max-md:bottom-[calc(76px+env(safe-area-inset-bottom))] max-md:-mx-1 max-md:bg-surface max-md:px-1 max-md:py-2">
      {answers.map((a) => (
        <Button
          key={a.how}
          variant={
            a.how === "forgot"
              ? "danger"
              : a.how === "hard"
                ? "outline"
                : "green"
          }
          aria-keyshortcuts={a.key}
          onClick={() => answer(a.how)}
          className="min-h-[52px] flex-col gap-0 px-2 leading-5"
        >
          {a.title}
          <span className="text-[11.5px] font-bold tracking-normal normal-case">
            {a.sub}
          </span>
        </Button>
      ))}
    </div>
  );
  const example = item?.it[4] || "";
  const target = item
    ? findTarget(example, item.it[1], formsOf(item.it))
    : null;

  return (
    <section className="grid items-start gap-6 @min-[56rem]:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <PageHeading>Ulang hari ini</PageHeading>
          <Lead>
            Kata yang kamu tandai hafal dan kesalahan dari Buku kesalahanku
            dijadwalkan ulang: {GAPS.join(" → ")} hari. Jawab jujur. Kalau lupa,
            jadwalnya mundur ke awal. Ini yang membuat{" "}
            {totalWords.toLocaleString("id-ID")} kata benar-benar menempel.
          </Lead>
          <div className="flex flex-wrap gap-2 pt-1">
            <Stat n={dueKeys.length} label="kata jatuh tempo" />
            <Stat n={dueMistakes.length} label="kesalahan jatuh tempo" />
            <Stat n={doneToday} label="selesai hari ini" />
            <Stat n={scheduled} label="kata dalam jadwal" />
          </div>
          <div className="pt-1">
            <Pill
              size="sm"
              check
              on={reviewOn}
              aria-pressed={reviewOn}
              onClick={() => setReviewOn(!reviewOn)}
            >
              Sertakan kartu kesalahan
            </Pill>
          </div>
        </div>

        {item && (
          <Card pad="lg" className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span className="text-[13.5px] font-bold text-ink-2">
                {lvName} · Minggu {item.w} · {typeDef(item.it[0]).label}
              </span>
              <span className="flex items-center gap-2.5 text-[13.5px] font-bold text-ink-2">
                Tahap {cur.st + 1} dari {GAPS.length}
                <span aria-hidden className="flex gap-1">
                  {GAPS.map((_, i) => (
                    <span
                      key={i}
                      className={classNames(
                        "h-1.5 w-5 rounded-full",
                        i <= cur.st ? "bg-accent" : "bg-track",
                      )}
                    />
                  ))}
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[34px] leading-10 font-black tracking-[-0.02em] wrap-anywhere text-ink md:text-[44px] md:leading-12">
                  {flip ? item.it[3] : item.it[1]}
                </span>
                {!flip && <SpeakButton text={item.it[1]} />}
              </div>
              {!flip && !!item.it[2] && (
                <span className="text-[15px] font-semibold text-ink-2">
                  /{item.it[2]}/
                </span>
              )}
            </div>
            {revealed ? (
              <>
                <div className="flex flex-col gap-2 border-t-2 border-dashed border-line pt-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xl leading-[26px] font-black text-ink">
                      {flip ? item.it[1] : item.it[3]}
                    </span>
                    {flip && <SpeakButton text={item.it[1]} />}
                  </div>
                  <p className="m-0 text-[15px] leading-[22px] text-ink">
                    {target ? (
                      <>
                        {example.slice(0, target[0])}
                        <TargetMark>
                          {example.slice(target[0], target[1])}
                        </TargetMark>
                        {example.slice(target[1])}
                      </>
                    ) : (
                      example
                    )}
                  </p>
                  {!!idOf(example) && (
                    <span className="-mt-1 text-[13.5px] text-ink-2">
                      {idOf(example)}
                    </span>
                  )}
                  {!!own[rvKey] && (
                    <span className="text-[13.5px] text-ink">
                      <span className="font-extrabold text-ink-2">
                        Kalimatmu:{" "}
                      </span>
                      <b className="font-extrabold">{own[rvKey]}</b>
                    </span>
                  )}
                </div>
                {note && (
                  <div className="flex flex-col gap-2 rounded-lg border-2 border-line bg-sunken px-4 py-3">
                    <SectionLabel>INGAT LAGI</SectionLabel>
                    <span className="text-sm leading-5 text-ink">
                      {note.core}
                    </span>
                    {!!note.traps?.length && !!note.traps[0][1] && (
                      <Correction
                        wrong={note.traps[0][0] || undefined}
                        right={note.traps[0][1]}
                      />
                    )}
                    {!!note.see?.length && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <SectionLabel>LIHAT JUGA</SectionLabel>
                        {note.see.map((s) => (
                          <Pill key={s} size="sm" onClick={() => jumpToWord(s)}>
                            {s}
                          </Pill>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {answerButtons}
              </>
            ) : (
              <>
                <span className="text-sm font-semibold text-ink-2">
                  {flip
                    ? "Ucapkan kata Inggrisnya dan satu kalimat, lalu buka."
                    : "Ucapkan artinya dan satu kalimat, lalu buka."}
                </span>
                <Button
                  variant="green"
                  size="lg"
                  aria-keyshortcuts="Space"
                  className="md:w-full"
                  onClick={() => setRevealed(true)}
                >
                  Buka jawaban
                </Button>
              </>
            )}
          </Card>
        )}

        {mistake && (
          <MistakeReviewCard
            key={mistake.id}
            m={mistake}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            answers={answerButtons}
          />
        )}

        {!item && !mistake && (
          <Card
            tone="dashed"
            className="items-center gap-3.5 px-6 py-9 text-center"
          >
            {/* Nothing due: proud after a session today, happy otherwise. */}
            {scheduled && (
              <Jalak mood={doneToday > 0 ? "bangga" : "senang"} size={96} />
            )}
            <span className="text-[15px] leading-[22px] font-semibold text-ink-2">
              {scheduled
                ? "Tidak ada yang jatuh tempo hari ini. Lanjut belajar kata baru."
                : "Belum ada kata terjadwal. Tandai 5 kata sebagai hafal hari ini, dan kata itu akan muncul di sini besok."}
            </span>
            <Button variant="green" onClick={() => router.push("/vocab")}>
              Ke Kosakata minggu ini →
            </Button>
          </Card>
        )}
      </div>

      {(item || mistake) && (
        <aside
          aria-label="Antrean dan pintasan"
          className="hidden flex-col gap-4 @min-[56rem]:flex"
        >
          {queue.length > 0 && (
            <Card className="gap-1.5">
              <SectionLabel className="pb-1">Antrean berikutnya</SectionLabel>
              {queue.map(({ k, label, st }) => (
                <div
                  key={k}
                  className="flex min-h-10 items-center justify-between gap-3 px-1 text-sm font-extrabold text-ink"
                >
                  <span className="min-w-0 truncate">{label}</span>
                  <span className="shrink-0 text-xs font-bold text-ink-2">
                    tahap {st + 1}
                  </span>
                </div>
              ))}
            </Card>
          )}
          <Card className="gap-1.5">
            <SectionLabel className="pb-1">Pintasan</SectionLabel>
            <dl className="m-0 flex flex-col gap-2">
              {SHORTCUTS.map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <dt className="w-14 shrink-0">
                    <kbd className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border-2 border-b-[3px] border-line bg-surface px-1.5 font-mono text-xs font-extrabold text-ink">
                      {key}
                    </kbd>
                  </dt>
                  <dd className="m-0 text-[13.5px] font-semibold text-ink-2">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        </aside>
      )}
    </section>
  );
});

ReviewPage.displayName = "ReviewPage";

export default ReviewPage;
