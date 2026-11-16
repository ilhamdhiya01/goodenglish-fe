"use client";

import classNames from "classnames";
import React, { useEffect, useMemo, useRef, useState } from "react";

import Correction from "@/components/shared/patterns/correction";
import TargetMark from "@/components/shared/patterns/target-mark";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import TextButton from "@/components/ui/text-button";
import TypeBadge from "@/components/ui/type-badge";
import { hasNote, idOf, noteOf } from "@/lib/content";
import { speak } from "@/lib/helpers/speech.helper";
import { itemKey, today } from "@/lib/helpers/storage.helper";
import { findTarget } from "@/lib/helpers/target.helper";
import { formsLine, formsOf, strip } from "@/lib/helpers/verb-forms.helper";
import { useJumpToWord } from "@/lib/hooks/useJumpToWord";
import { useNotes } from "@/lib/hooks/useNotes";
import type { Item } from "@/lib/types/vocab.types";
import { useAccessStore } from "@/stores/useAccessStore";
import { useAiChatStore } from "@/stores/useAiChatStore";
import { confirmDialog } from "@/stores/useConfirmStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { isSharedKey } from "@/stores/useSharedWordsStore";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

interface Props {
  k: string;
  it: Item;
  focused: boolean;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z' ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Satu kartu kosakata: kata, lafal, jenis, arti, contoh, bentuk kata (V1 → V2 → V3),
// "lebih natural", penjelasan detail, kalimatku, plus mode tes / mode ketik.
const WordCard = React.memo(({ k, it, focused }: Props) => {
  const [t, en, pron, id, ex, syn] = it;
  const { jumpToWord } = useJumpToWord();
  const level = useLevelStore((s) => s.level);

  const kn = useProgressStore((s) => !!s.known[k]);
  const srs = useProgressStore((s) => s.srs[k]);
  const own = useProgressStore((s) => s.own[k] || "");
  const toggleKnown = useProgressStore((s) => s.toggleKnown);
  const setOwnSentence = useProgressStore((s) => s.setOwnSentence);
  const custom = useProgressStore((s) => s.custom);
  const removeCustomWord = useProgressStore((s) => s.removeCustomWord);
  const hasAi = useAccessStore((s) => !!s.session?.menus.includes("ai"));
  const aiWord = { word: en, meaning: id };

  const quiz = useVocabUiStore((s) => s.quiz);
  const flip = useVocabUiStore((s) => s.flip);
  const recall = useVocabUiStore((s) => s.recall);
  const revealed = useVocabUiStore((s) => !!s.revealed[k]);
  const ui = useVocabUiStore.getState;

  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const ref = useRef<HTMLElement>(null);

  // Tombol muncul kalau kata punya penjelasan; isinya dimuat saat panel dibuka pertama kali.
  const hasNoteFor = hasNote(en);
  const notesReady = useNotes(noteOpen);
  const note = notesReady ? noteOf(en) : null;
  const hidden = quiz && !revealed;
  // Bentuk V1 → V2 → V3 (lihat lib/verb-forms: data per kartu, Kataku jatuh ke tabel tak beraturan).
  // it[6] terisi untuk kata tambahan: Kataku milik sendiri, atau kosakata
  // bersama dari admin (dikelola di dashboard, tampil seperti kata biasa).
  const isMine = !!it[6] && !isSharedKey(it[6]);
  const vf = formsOf(it);
  const v: [string, string, boolean] | null = vf
    ? [vf.v2, vf.v3, vf.irregular]
    : null;
  const ing = vf?.ing || "";
  const same = !!vf?.same;
  const forms = vf ? formsLine(en, vf) : "";
  const speakForms = () =>
    speak(!v ? en : same ? en : [en, strip(v[0]), strip(v[1])].join(", "));

  const showOwn = open || !!own;
  const hasOwn = !!own;
  const val = draft ?? own;
  const dirty = draft !== null;
  const commit = () => {
    if (draft !== null) {
      setOwnSentence(k, draft);
      setDraft(null);
    }
  };

  const check = () => {
    const ok = norm(typed) === norm(en);
    setResult(ok);
    if (ok) {
      speak(en);
      setTimeout(() => ui().reveal(k), 500);
    }
  };

  const edit = () => {
    const c = custom.find((x) => x.key === it[6]);
    if (c)
      ui().openForm({
        editKey: c.key,
        en: c.en,
        id: c.id,
        pron: c.pron,
        ex: c.ex,
        type: c.type,
        week: c.week,
      });
  };
  const remove = () => {
    const c = custom.find((x) => x.key === it[6]);
    if (!c) return;
    void confirmDialog({
      title: `Hapus "${c.en}" dari Kataku?`,
      confirmLabel: "Hapus",
      tone: "danger",
    }).then(
      (ok) =>
        ok &&
        removeCustomWord(c.key, (x) => itemKey(level, x.week, x.type, x.en)),
    );
  };

  const T0 = today();
  useEffect(() => {
    if (!focused) return;
    if (hasNoteFor) setNoteOpen(true);
    // Where the card's top should land: under the sticky toolbar (which
    // itself sits under the phone's top bar, top = --shell-top).
    const wantTop = () => {
      const bar = document.querySelector<HTMLElement>("[data-vocab-toolbar]");
      const css = bar && getComputedStyle(bar);
      return bar && css?.position === "sticky"
        ? bar.offsetHeight + (parseFloat(css.top) || 0) + 16
        : 110;
    };
    // Smooth scroll there; once it stops, check and correct once more in
    // case something above changed height meanwhile. Reduced motion jumps.
    const behavior: ScrollBehavior = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches
      ? "auto"
      : "smooth";
    const delta = () =>
      ref.current ? ref.current.getBoundingClientRect().top - wantTop() : 0;
    let settle = 0;
    let fixes = 0;
    const check = () => {
      const d = delta();
      if (Math.abs(d) > 4 && fixes++ < 2) {
        window.scrollBy({ top: d, behavior });
        settle = window.setTimeout(check, 700);
      }
    };
    const onEnd = () => {
      clearTimeout(settle);
      settle = window.setTimeout(check, 50);
    };
    // The learner scrolling on their own takes over.
    const stop = () => {
      clearTimeout(settle);
      window.removeEventListener("scrollend", onEnd);
      fixes = 99;
    };
    window.addEventListener("scrollend", onEnd);
    window.addEventListener("wheel", stop, { passive: true, once: true });
    window.addEventListener("touchstart", stop, { passive: true, once: true });
    const t = setTimeout(() => {
      window.scrollBy({ top: delta(), behavior });
      // Browsers without scrollend still get the check.
      settle = window.setTimeout(check, 900);
    }, 60);
    return () => {
      clearTimeout(t);
      stop();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused]);

  const badges = (
    <>
      <TypeBadge type={t} />
      {isMine && (
        <span className="rounded-[7px] border-2 border-dashed border-accent-line px-1.5 py-px text-[11px] font-extrabold tracking-[0.06em] text-accent-edge">
          KATAKU
        </span>
      )}
    </>
  );

  // Dashed "look first" button that reveals the hidden half of the card.
  const revealLink = (label: string) => (
    <button
      type="button"
      onClick={() => ui().reveal(k)}
      className="min-h-11 w-full cursor-pointer rounded-lg border-2 border-dashed border-control bg-transparent px-3.5 py-2 text-left text-sm font-extrabold text-accent-edge focus-ring hover:bg-sunken"
    >
      {label}
    </button>
  );

  const recallBox = (
    <div className="flex max-w-[460px] flex-col gap-1.5 self-stretch">
      <div className="flex gap-2">
        <Input
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            setResult(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") check();
          }}
          aria-label="Kata Inggrisnya"
          aria-invalid={result === false}
          placeholder="Ketik kata Inggrisnya, lalu Enter"
          className={classNames(result && "border-ok")}
        />
        <Button variant="green" onClick={check} className="shrink-0">
          Cek
        </Button>
      </div>
      {result === false && (
        <span className="text-[13px] font-bold text-bad">
          ✕ Belum tepat. Coba lagi, atau{" "}
          <TextButton tone="red" onClick={() => ui().reveal(k)}>
            lihat jawabannya
          </TextButton>
          .
        </span>
      )}
      {result && (
        <span className="text-[13px] font-extrabold text-ok">✓ Tepat!</span>
      )}
    </div>
  );

  // The example with the card's word marked ("We *ran out of* coffee").
  const target = useMemo(
    () => (ex ? findTarget(ex, en, vf) : null),
    // vf is derived from it on every render; it changes only with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ex, en, it],
  );
  const example = target ? (
    <>
      {ex.slice(0, target[0])}
      <TargetMark>{ex.slice(target[0], target[1])}</TargetMark>
      {ex.slice(target[1])}
    </>
  ) : (
    ex
  );

  return (
    <article
      ref={ref}
      className={classNames(
        "grid gap-2.5 rounded-xl border-2 px-4 py-3.5 edge-card transition-colors duration-300 md:grid-cols-[minmax(0,1fr)_auto] md:gap-3 md:px-[18px] md:py-4",
        focused
          ? "border-accent bg-surface [--edge:var(--color-accent)]"
          : kn
            ? "border-line bg-sunken"
            : "border-line bg-surface",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5 md:gap-2">
        {flip && (
          <>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span
                className={classNames(
                  "text-xl leading-[26px] font-black wrap-anywhere",
                  kn ? "text-ink-3" : "text-ink",
                )}
              >
                {id}
              </span>
              {badges}
            </div>
            {hidden &&
              !recall &&
              revealLink("Ucapkan kata Inggrisnya dulu, lalu klik untuk lihat")}
            {hidden && recall && recallBox}
          </>
        )}
        {(!flip || !hidden) && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span
              className={classNames(
                "wrap-anywhere",
                flip
                  ? "text-[17px] leading-6 font-extrabold text-accent-edge"
                  : classNames(
                      "text-xl leading-[26px] font-black",
                      kn ? "text-ink-3" : "text-ink",
                    ),
              )}
            >
              {en}
            </span>
            <SpeakButton text={en} />
            {!!pron && (
              <span className="text-[13.5px] font-semibold text-ink-2">
                /{pron}/
              </span>
            )}
            {!flip && badges}
          </div>
        )}
        {/* Disembunyikan di mode tes "sembunyikan kata Inggris" supaya jawabannya tidak bocor. */}
        {!!forms && !(flip && hidden) && (
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-ink-2">
            <span
              className={classNames(
                "rounded-[6px] px-1.5 py-px text-[10.5px] font-extrabold tracking-[0.06em]",
                v?.[2] ? "bg-bad-bg text-bad" : "bg-chip text-ink-2",
              )}
            >
              {v?.[2] ? "IRREGULAR" : "REGULAR"}
            </span>
            <span className="text-ink">{forms}</span>
            {same && <span>V1 = V2 = V3</span>}
            {!!ing && <span>· -ing: {ing}</span>}
            <SpeakButton
              size={28}
              icon={13}
              onClick={speakForms}
              title="Dengarkan bentuknya"
            />
          </div>
        )}
        {!flip &&
          hidden &&
          revealLink("Tebak artinya dulu, lalu klik untuk lihat")}
        {(!flip || !hidden) && (
          <p className="m-0 text-[15px] leading-[22px] text-pretty text-ink">
            {!flip && !hidden && (
              <>
                <b className="font-extrabold">{id}</b>
                {ex && " · "}
              </>
            )}
            {example}
          </p>
        )}
        {!hidden && !!ex && !!idOf(ex) && (
          <span className="-mt-1 text-[13.5px] leading-[19px] text-pretty text-ink-2">
            {idOf(ex)}
          </span>
        )}
        {!!syn && syn !== "—" && (
          <span className="text-[13.5px] text-ink-2">
            <span className="font-extrabold text-accent-edge">
              Lebih natural:{" "}
            </span>
            {syn}
          </span>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {hasNoteFor && !hidden && (
            <TextButton
              aria-expanded={noteOpen}
              title="Penjelasan detail"
              onClick={() => setNoteOpen(!noteOpen)}
            >
              {noteOpen ? "Tutup penjelasan" : "Penjelasan"}
            </TextButton>
          )}
          <TextButton onClick={() => setOpen(!open)}>
            {own
              ? open
                ? "tutup kalimatku"
                : "✎ kalimatku"
              : open
                ? "tutup"
                : "+ kalimatku"}
          </TextButton>
          {hasAi && (
            <TextButton
              title="Tanya AI soal kata ini"
              onClick={() => useAiChatStore.getState().openWith(aiWord, {})}
            >
              tanya AI
            </TextButton>
          )}
          {isMine && (
            <>
              <TextButton onClick={edit}>Ubah</TextButton>
              <TextButton tone="red" onClick={remove}>
                Hapus
              </TextButton>
            </>
          )}
          {kn && srs && (
            <span className="text-xs font-bold text-ink-2">
              {srs.due <= T0
                ? "ulang hari ini"
                : "ulang dalam " + (srs.due - T0) + " hari"}
            </span>
          )}
        </div>

        {hasNoteFor && noteOpen && !hidden && !note && (
          <span className="text-[13px] font-bold text-ink-2">
            Memuat penjelasan…
          </span>
        )}
        {!!note && noteOpen && !hidden && (
          <div className="flex flex-col gap-3.5 rounded-lg border-2 border-line bg-sunken px-4 py-3.5">
            <div className="flex flex-col gap-1">
              <SectionLabel tone="green">INTI</SectionLabel>
              <span className="text-[15px] leading-[22px] text-pretty text-ink">
                {note.core}
              </span>
            </div>
            {!!note.forms?.length && (
              <div className="flex flex-col gap-1">
                <SectionLabel tone="green">BENTUK</SectionLabel>
                <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3.5 gap-y-1">
                  {note.forms.map(([a, b], i) => (
                    <div key={i} className="contents">
                      <span className="text-[13px] font-semibold whitespace-nowrap text-ink-2">
                        {a}
                      </span>
                      <span className="text-sm font-bold text-ink">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!!note.use?.length && (
              <div className="flex flex-col gap-1">
                <SectionLabel tone="green">KAPAN DIPAKAI</SectionLabel>
                <div className="flex flex-col gap-2">
                  {note.use.map(([e, i2], i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-[15px] leading-[22px] font-bold text-ink">
                          {e}
                        </span>
                        <SpeakButton size={28} icon={13} text={e} />
                        {!!i2 && i2 !== idOf(e) && (
                          <span className="text-xs font-bold text-ink-2">
                            {i2}
                          </span>
                        )}
                      </div>
                      {!!(idOf(e) || i2) && (
                        <span className="text-[13px] text-ink-2">
                          {idOf(e) || i2}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!!note.traps?.length && (
              <div className="flex flex-col gap-1.5">
                <SectionLabel tone="red">JEBAKAN UMUM</SectionLabel>
                <div className="flex flex-col gap-2.5">
                  {note.traps.map(([bad, good, why], i) =>
                    good ? (
                      <Correction
                        key={i}
                        wrong={bad || undefined}
                        right={good}
                        why={why || undefined}
                      />
                    ) : (
                      <div key={i} className="flex flex-col gap-0.5">
                        <span className="text-[15px] font-bold text-bad">
                          {bad}
                        </span>
                        {!!why && (
                          <span className="text-[13.5px] text-ink-2">
                            {why}
                          </span>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {!!note.see?.length && (
              <div className="flex flex-wrap items-center gap-2">
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

        {showOwn && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Input
                value={val}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                aria-label="Kalimatku"
                placeholder="Tulis satu kalimatmu sendiri dengan kata ini, lalu Enter…"
              />
              {hasOwn && (
                <>
                  <SpeakButton text={own} title="Dengarkan kalimatku" />
                  {hasAi && !dirty && (
                    <TextButton
                      title="Cek kalimatku dengan AI"
                      className="whitespace-nowrap"
                      onClick={() =>
                        useAiChatStore.getState().openWith(aiWord, {
                          text: `Cek kalimatku dengan kata "${en}": ${own}`,
                        })
                      }
                    >
                      cek AI
                    </TextButton>
                  )}
                  <TextButton
                    tone="red"
                    title="Hapus kalimatku"
                    className="whitespace-nowrap"
                    onClick={() => {
                      setOwnSentence(k, "");
                      setDraft(null);
                      setOpen(false);
                    }}
                  >
                    hapus
                  </TextButton>
                </>
              )}
            </div>
            {hasOwn && !dirty && (
              <span className="text-xs font-extrabold text-ok">
                ✓ tersimpan · dipakai saat ulangan
              </span>
            )}
          </div>
        )}
      </div>

      <div className="md:col-start-2 md:row-start-1">
        <Button
          size="sm"
          variant={kn ? "green" : "outline"}
          aria-pressed={kn}
          title="Tandai hafal"
          onClick={() => toggleKnown(k)}
          className="w-full whitespace-nowrap md:w-auto"
        >
          {kn ? "✓ Hafal" : "Tandai hafal"}
        </Button>
      </div>
    </article>
  );
});

WordCard.displayName = "WordCard";

export default WordCard;
