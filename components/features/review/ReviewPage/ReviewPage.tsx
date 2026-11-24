"use client";

import classNames from "classnames";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import Jalak from "@/components/brand/Jalak";
import {
  judgeTyped,
  type TypedResult,
} from "@/components/features/vocab/KnownProof";
import TargetMark from "@/components/shared/patterns/target-mark";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import PageHeading from "@/components/ui/page-heading";
import Pill from "@/components/ui/pill";
import SpeakButton from "@/components/ui/speak-button";
import TextButton from "@/components/ui/text-button";
import { LEVELS } from "@/const/levels.constant";
import { GAPS } from "@/const/srs.constant";
import { hasNote, idOf, noteOf } from "@/lib/content";
import { resolveItemKey } from "@/lib/helpers/derived.helper";
import { markLetters } from "@/lib/helpers/dictation.helper";
import { tallyOf } from "@/lib/helpers/plan-check.helper";
import { nextSrs, type SrsAnswer } from "@/lib/helpers/srs.helper";
import { today } from "@/lib/helpers/storage.helper";
import { dayToDate } from "@/lib/helpers/streak.helper";
import { findTarget } from "@/lib/helpers/target.helper";
import { formsOf } from "@/lib/helpers/verb-forms.helper";
import { useGradeOnLeave } from "@/lib/hooks/useGradeOnLeave";
import { useJumpToWord } from "@/lib/hooks/useJumpToWord";
import { useNotes } from "@/lib/hooks/useNotes";
import { useShellData } from "@/lib/hooks/useShellData";
import { laporAktivitas } from "@/lib/rencana/lapor";
import { useAccessStore } from "@/stores/useAccessStore";
import { useAiChatStore } from "@/stores/useAiChatStore";
import { useLaporanStore } from "@/stores/useLaporanStore";
import { useMistakeStore } from "@/stores/useMistakeStore";
import { usePlanStore } from "@/stores/usePlanStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

import MistakeReviewCard from "../MistakeReviewCard";
import ReviewQuiz from "../ReviewQuiz";

// "Senin, 24 Nov" for a day number (days are UTC midnights, see dayToDate).
const DAY_FMT = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

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

// Halaman "Ulang hari ini": satu kartu SRS per kata yang jatuh tempo, satu
// kolom. Spasi membuka jawaban, 1 / 2 / 3 menjawab Lupa / Ragu / Ingat; di
// arah Indo → Inggris kata Inggrisnya diketik dan dinilai otomatis.
const ReviewPage = React.memo(() => {
  const {
    dueKeys,
    dueMistakes,
    scheduled,
    doneToday,
    allLevels,
    srs,
    own,
    known,
  } = useShellData();
  const bumpSrs = useProgressStore((s) => s.bumpSrs);
  const gradeMistake = useMistakeStore((s) => s.grade);
  const reviewOn = useMistakeStore((s) => s.reviewOn);
  const setReviewOn = useMistakeStore((s) => s.setReviewOn);
  const flip = useVocabUiStore((s) => s.flip);
  const { jumpToWord } = useJumpToWord();
  const router = useRouter();
  // The quiz is offered while nothing was reviewed today and it isn't done
  // yet (kept on screen once started, until it says "selesai").
  const tally = usePlanStore((s) => s.plan.tally);
  const T0 = today();
  const t = tallyOf(tally, T0);
  // Rencana links here with ?kuis=1 (Friday's "Kata" step): the quiz is
  // shown even after reviewing. useSearchParams, not window.location: on an
  // in-app move the address bar changes only after this page has drawn.
  const quizAsked = useSearchParams().get("kuis") === "1";
  const [quizShown] = useState(() => quizAsked || (!t.rev && !t.q1));
  const quizOffered = quizShown || (!t.rev && !t.q1);

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
  const hasAi = useAccessStore((s) => !!s.session?.menus.includes("ai"));
  const [revealed, setRevealed] = useState(false);
  // Indo → Inggris word cards: the English word is typed, then rated from
  // the result (see `typing` below).
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<TypedResult | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  // Reset saat kartu berganti atau mode flip dibalik (seperti rvRevealed versi lama).
  // Done during render (React's "reset state when a value changes" pattern)
  // instead of in an effect, so the old card never flashes revealed.
  const [revealedFor, setRevealedFor] = useState(`${cardId}|${flip}`);
  if (revealedFor !== `${cardId}|${flip}`) {
    setRevealedFor(`${cardId}|${flip}`);
    setRevealed(false);
    setTyped("");
    setResult(null);
    setNoteOpen(false);
  }

  const item = rvKey && !mistake ? resolveItemKey(allLevels, rvKey) : null;

  // Rencana: the day's due cards are all answered (once per day).
  const queueEmpty = !rvKey && !nextMistake;
  useEffect(() => {
    if (!queueEmpty || doneToday === 0) return;
    const T = today();
    const sent = useLaporanStore
      .getState()
      .items.some((l) => l.jenis === "ulang_habis" && l.day === T);
    if (!sent) laporAktivitas("ulang_habis", { data: {} });
  }, [queueEmpty, doneToday]);
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

  const answer = (how: (typeof answers)[number]["how"], typed?: string) => {
    if (mistake) gradeMistake(mistake.id, how, typed);
    else if (rvKey) bumpSrs(rvKey, how);
  };

  // Indo → Inggris word cards are answered by typing the English word; the
  // rating follows from the result instead of being picked: right → Ingat,
  // a slip → Ragu, wrong → Lupa. Other cards keep Buka jawaban + 1/2/3.
  const typing = flip && !!item;
  const typedHow =
    result === "ok" ? "good" : result === "near" ? "hard" : "forgot";
  const check = () => {
    if (!item || !typed.trim()) return;
    setResult(judgeTyped(item.it[1], typed));
    setRevealed(true);
  };
  // Nothing to type when the word is simply not known: same as wrong (Lupa).
  const dontKnow = () => {
    setTyped("");
    setResult("bad");
    setRevealed(true);
  };
  const settle = useGradeOnLeave(typing && result ? cardId : null, () =>
    answer(typedHow),
  );

  // Space opens the answer; 1 / 2 / 3 = Lupa / Ragu / Ingat once it's open.
  useEffect(() => {
    if (!item && !mistake) return;
    const onKey = (e: KeyboardEvent) => {
      // Typed cards (Indo → Inggris words, every mistake card) are checked
      // and rated from the answer, so no Space / 1 / 2 / 3.
      if (typing || mistake || ignoreKey(e)) return;
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

  // The card after this one, for the "Berikutnya" line: same turn-taking
  // as above, one answer later.
  const nextWord = (mistake ? dueKeys : dueKeys.filter((k) => k !== rvKey))
    .map((k) => resolveItemKey(allLevels, k))
    .find((x) => !!x);
  const nextMistakeAfter = mistake ? dueMistakes[1] : dueMistakes[0];
  const upNext =
    nextMistakeAfter && (!nextWord || (doneToday + 1) % 2 === 1)
      ? nextMistakeAfter.wrong
      : nextWord?.it[flip ? 3 : 1];
  const left = dueKeys.length + dueMistakes.length;
  const sessionTotal = doneToday + left;
  const dueTomorrow = Object.keys(srs).filter(
    (k) => known[k] && srs[k].due === T0 + 1,
  ).length;

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
  // Typed answer: one Lanjut that applies the rating the result gave, with
  // when the card comes back.
  const comesBack = (how: SrsAnswer) => {
    const gap = nextSrs(cur, how, T0).gap;
    return how === "forgot"
      ? "Muncul lagi besok, mulai dari awal"
      : gap === 1
        ? "Muncul lagi besok"
        : `Muncul lagi ${DAY_FMT.format(dayToDate(T0 + gap))}`;
  };
  const continueButton = (
    <div className="flex flex-col gap-2 max-md:sticky max-md:bottom-[calc(76px+env(safe-area-inset-bottom))] max-md:-mx-1 max-md:bg-surface max-md:px-1 max-md:py-2">
      <Button
        variant="green"
        size="lg"
        autoFocus
        onClick={() => settle() && answer(typedHow)}
        className="w-full"
      >
        Lanjut
      </Button>
      <span className="text-center text-[13px] font-semibold text-ink-3">
        {comesBack(typedHow)}
      </span>
    </div>
  );
  const example = item?.it[4] || "";
  const target = item
    ? findTarget(example, item.it[1], formsOf(item.it))
    : null;
  const trap = note?.traps?.find((x) => !!x[1]);
  // The English side of the card: the word, its speaker and /pron/.
  const english = item && (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[34px] leading-10 font-black tracking-[-0.015em] wrap-anywhere text-ink">
        {item.it[1]}
      </span>
      <SpeakButton text={item.it[1]} />
      {!!item.it[2] && (
        <span className="text-[15px] font-semibold text-ink-2">
          /{item.it[2]}/
        </span>
      )}
    </div>
  );
  const meaning = item && (
    <span className="text-[34px] leading-10 font-black tracking-[-0.015em] wrap-anywhere text-ink">
      {item.it[3]}
    </span>
  );

  return (
    <section className="mx-auto flex w-full max-w-[640px] flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <PageHeading>Ulang hari ini</PageHeading>
          {left > 0 && (
            <span className="text-sm font-bold text-ink-2 tabular-nums">
              {left} lagi
            </span>
          )}
        </div>
        {sessionTotal > 0 && (
          <div
            role="progressbar"
            aria-label="Ulang hari ini"
            aria-valuemin={0}
            aria-valuemax={sessionTotal}
            aria-valuenow={doneToday}
            className="h-1 overflow-hidden rounded-full bg-track"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${(doneToday / sessionTotal) * 100}%` }}
            />
          </div>
        )}
      </div>

      {item && (
        <Card pad="lg" className="gap-5">
          <span className="text-[13px] font-semibold text-ink-3">
            {lvName} · minggu {item.w}
          </span>
          {revealed ? (
            <>
              <span className="text-[15px] font-bold text-ink-2">
                {flip ? item.it[3] : item.it[1]}
              </span>
              {flip ? english : meaning}
              {typing && result && (
                <p
                  role="status"
                  className={classNames(
                    "m-0 text-[15px] font-bold",
                    result === "bad"
                      ? "text-bad"
                      : result === "near"
                        ? "text-warn"
                        : "text-ok",
                  )}
                >
                  {result === "ok"
                    ? "Tepat."
                    : !typed
                      ? "Belum tahu. Ini jawabannya."
                      : result === "near"
                        ? "Hampir. Kamu menulis "
                        : "Belum tepat. Kamu menulis "}
                  {result === "near" && !!typed && (
                    <>
                      {/* The letters to fix: wrong or extra, "_" = missing. */}
                      {markLetters(item.it[1], typed).map((p, i) =>
                        p.bad ? (
                          <span
                            key={i}
                            className="text-bad underline decoration-wavy decoration-2 underline-offset-4"
                          >
                            {p.t}
                          </span>
                        ) : (
                          <span key={i}>{p.t}</span>
                        ),
                      )}
                      .
                    </>
                  )}
                  {result === "bad" && !!typed && (
                    <>
                      <s className="decoration-2">{typed}</s>.
                    </>
                  )}
                </p>
              )}
              {!!example && (
                <div className="flex flex-col gap-0.5">
                  <p className="m-0 text-base leading-6 text-ink">
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
                    <span className="text-sm text-ink-2">{idOf(example)}</span>
                  )}
                </div>
              )}
              {!!own[rvKey] && (
                <p className="m-0 text-sm text-ink-2">
                  Kalimatmu: <b className="text-ink">{own[rvKey]}</b>
                </p>
              )}
              {trap && (
                <p className="m-0 text-sm leading-6 text-ink-2">
                  Jangan:{" "}
                  {trap[0] && (
                    <s className="text-bad decoration-2">{trap[0]}</s>
                  )}{" "}
                  Yang benar: <b className="text-ink">{trap[1]}</b>
                </p>
              )}
              {note && (
                <div className="flex flex-col gap-2">
                  <TextButton
                    aria-expanded={noteOpen}
                    onClick={() => setNoteOpen(!noteOpen)}
                    className="self-start"
                  >
                    {noteOpen ? "Tutup penjelasan" : "Penjelasan lengkap"}
                  </TextButton>
                  {noteOpen && (
                    <>
                      <p className="m-0 text-sm leading-6 text-ink-2">
                        {note.core}
                      </p>
                      {!!note.see?.length && (
                        <div className="flex flex-wrap items-center gap-1.5 text-sm text-ink-2">
                          Lihat juga:
                          {note.see.map((s) => (
                            <Pill
                              key={s}
                              size="sm"
                              onClick={() => jumpToWord(s)}
                            >
                              {s}
                            </Pill>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {hasAi && (
                <TextButton
                  title="Tanya AI soal kata ini"
                  onClick={() =>
                    useAiChatStore
                      .getState()
                      .openWith({ word: item.it[1], meaning: item.it[3] }, {})
                  }
                  className="self-start"
                >
                  tanya AI
                </TextButton>
              )}
              {typing ? continueButton : answerButtons}
            </>
          ) : typing ? (
            <>
              {meaning}
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  check();
                }}
              >
                <Input
                  autoFocus
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Ketik kata Inggrisnya"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label={`Ketik kata Inggris untuk "${item.it[3]}"`}
                />
                <Button
                  type="submit"
                  variant="green"
                  disabled={!typed.trim()}
                  className="shrink-0"
                >
                  Cek
                </Button>
              </form>
              <TextButton onClick={dontKnow} className="self-start">
                Nggak tahu
              </TextButton>
            </>
          ) : (
            <>
              {english}
              <span className="text-sm font-semibold text-ink-2">
                Ucapkan artinya dan satu kalimat, lalu buka.
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
          onGrade={answer}
          comesBack={comesBack}
        />
      )}

      {(item || mistake) && !!upNext && (
        <span className="text-[13.5px] font-semibold text-ink-3">
          Berikutnya: {upNext}
        </span>
      )}

      {/* Nothing due and nothing reviewed today (or asked for from
          Rencana): the 5-question quiz. */}
      {!item && !mistake && quizOffered && <ReviewQuiz />}

      {!item && !mistake && (
        <Card
          tone="dashed"
          className="items-center gap-3 px-6 py-9 text-center"
        >
          {/* Nothing due: proud after a session today, happy otherwise. */}
          {scheduled > 0 && (
            <Jalak mood={doneToday > 0 ? "bangga" : "senang"} size={96} />
          )}
          {doneToday > 0 ? (
            <>
              <span className="text-xl font-black text-ink">
                Selesai untuk hari ini
              </span>
              <span className="text-[15px] leading-[22px] text-ink-2">
                {doneToday} kartu diulang.{" "}
                {dueTomorrow > 0
                  ? `Besok ada ${dueTomorrow} kata.`
                  : "Besok belum ada yang jatuh tempo."}
              </span>
            </>
          ) : (
            <span className="text-[15px] leading-[22px] font-semibold text-ink-2">
              {scheduled > 0
                ? "Tidak ada yang jatuh tempo hari ini. Lanjut belajar kata baru."
                : "Belum ada kata terjadwal. Tandai 5 kata sebagai hafal hari ini, dan kata itu akan muncul di sini besok."}
            </span>
          )}
          <Button variant="green" onClick={() => router.push("/vocab")}>
            Ke Kosakata minggu ini →
          </Button>
        </Card>
      )}

      {/* A setting, not part of the card: one row, the whole row toggles. */}
      <button
        type="button"
        role="switch"
        aria-checked={reviewOn}
        onClick={() => setReviewOn(!reviewOn)}
        className="flex w-full items-center justify-between gap-4 rounded-xl border-t border-line pt-4 text-left focus-ring"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] font-bold text-ink">
            Sertakan kartu kesalahan
          </span>
          <span className="text-[13px] font-semibold text-ink-3">
            Kalimat yang pernah kamu salah ikut diulang di sini.
          </span>
        </span>
        <span
          aria-hidden
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${reviewOn ? "bg-accent" : "bg-control"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-surface shadow-sm transition-transform ${reviewOn ? "translate-x-5" : ""}`}
          />
        </span>
      </button>
    </section>
  );
});

ReviewPage.displayName = "ReviewPage";

export default ReviewPage;
