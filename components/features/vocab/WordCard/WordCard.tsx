"use client";

import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";

import SpeakButton from "@/components/ui/speak-button";
import TypeBadge from "@/components/ui/type-badge";
import { hasNote, idOf, noteOf } from "@/lib/content";
import { speak } from "@/lib/helpers/speech.helper";
import { itemKey, today } from "@/lib/helpers/storage.helper";
import { formsLine, formsOf, strip } from "@/lib/helpers/verb-forms.helper";
import { useJumpToWord } from "@/lib/hooks/useJumpToWord";
import { useNotes } from "@/lib/hooks/useNotes";
import type { Item } from "@/lib/types/vocab.types";
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
    if (c && window.confirm('Hapus "' + c.en + '" dari Kataku?'))
      removeCustomWord(c.key, (x) => itemKey(level, x.week, x.type, x.en));
  };

  const T0 = today();
  useEffect(() => {
    if (!focused) return;
    if (hasNoteFor) setNoteOpen(true);
    const go = () => {
      if (ref.current) {
        // Sisakan ruang untuk toolbar yang menempel di atas (kalau sedang sticky).
        const bar = document.querySelector<HTMLElement>("[data-vocab-toolbar]");
        const offset =
          bar && getComputedStyle(bar).position === "sticky"
            ? bar.offsetHeight + 16
            : 110;
        const y =
          ref.current.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    };
    const t1 = setTimeout(go, 60);
    const t2 = setTimeout(go, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused]);

  const badges = (
    <>
      <TypeBadge type={t} />
      {isMine && (
        <span className="rounded border border-dashed border-green px-[7px] py-0.5 font-mono text-[10.5px] tracking-[0.06em] text-green">
          KATAKU
        </span>
      )}
    </>
  );

  const revealLink = (label: string) => (
    <button
      type="button"
      onClick={() => ui().reveal(k)}
      className="cursor-pointer self-start border-0 border-b-[1.5px] border-dotted border-green bg-transparent p-0 font-sans text-[13px] text-green"
    >
      {label}
    </button>
  );

  const recallBox = (
    <div className="flex max-w-[420px] flex-col gap-1.5 self-stretch">
      <div className="flex gap-2">
        <input
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            setResult(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") check();
          }}
          placeholder="Ketik kata Inggrisnya, lalu Enter"
          className={classNames(
            "min-w-0 flex-1 rounded-md border-[1.5px] bg-card px-2.5 py-2 font-sans text-sm text-ink outline-none",
            result === false
              ? "border-red"
              : result
                ? "border-green"
                : "border-line-2",
          )}
        />
        <button
          type="button"
          onClick={check}
          className="cursor-pointer rounded-md bg-ink px-3.5 py-2 font-sans text-[13px] font-semibold whitespace-nowrap text-paper"
        >
          Cek
        </button>
      </div>
      {result === false && (
        <span className="text-[12.5px] text-red">
          Belum tepat. Coba lagi, atau{" "}
          <button
            type="button"
            onClick={() => ui().reveal(k)}
            className="cursor-pointer border-0 border-b border-dotted border-red bg-transparent p-0 text-red"
          >
            lihat jawabannya
          </button>
          .
        </span>
      )}
      {result && (
        <span className="text-[12.5px] font-semibold text-green">✓ Tepat!</span>
      )}
    </div>
  );

  return (
    <article
      ref={ref}
      className={classNames(
        "flex flex-wrap items-start justify-between gap-3.5 rounded-[10px] border-[1.5px] px-[18px] py-4 transition-[box-shadow,border-color] duration-300",
        kn ? "border-known-line bg-known-bg" : "border-line bg-card",
        focused && "border-green shadow-[0_0_0_3px_var(--color-focus-ring)]",
      )}
    >
      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-[7px]">
        {flip && (
          <>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="text-xl font-bold tracking-[-0.01em] wrap-anywhere">
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
          <div className="flex flex-wrap items-baseline gap-2.5">
            {flip ? (
              <span className="text-[17px] font-semibold wrap-anywhere text-green">
                {en}
              </span>
            ) : (
              <span className="text-xl font-bold tracking-[-0.01em] wrap-anywhere">
                {en}
              </span>
            )}
            <SpeakButton text={en} />
            {!!pron && (
              <span className="font-mono text-[12.5px] text-muted">
                /{pron}/
              </span>
            )}
            {!flip && badges}
            {hasNoteFor && !hidden && (
              <button
                type="button"
                onClick={() => setNoteOpen(!noteOpen)}
                title="Penjelasan detail"
                className={classNames(
                  "inline-flex cursor-pointer items-center gap-[5px] rounded-full border-[1.5px] px-[9px] py-[3px] font-sans text-[11.5px] font-semibold transition-colors",
                  noteOpen
                    ? "border-green bg-green text-card"
                    : "border-line-2 bg-transparent text-green hover:border-green",
                )}
              >
                <span className="font-serif text-[13px] leading-none italic">
                  i
                </span>
                {noteOpen ? "Tutup penjelasan" : "Penjelasan"}
              </button>
            )}
          </div>
        )}
        {/* Disembunyikan di mode tes "sembunyikan kata Inggris" supaya jawabannya tidak bocor. */}
        {!!forms && !(flip && hidden) && (
          <div className="flex flex-wrap items-center gap-2 font-mono text-[12.5px] text-muted">
            <span
              className={classNames(
                "rounded px-1.5 py-0.5 text-[10.5px] tracking-[0.06em]",
                v?.[2] ? "bg-red-bg text-red" : "bg-green-bg text-green",
              )}
            >
              {v?.[2] ? "IRREGULAR" : "REGULAR"}
            </span>
            <span className="text-ink">{forms}</span>
            {same && <span className="text-faint">V1 = V2 = V3</span>}
            {!!ing && <span className="text-faint">· -ing: {ing}</span>}
            <SpeakButton
              size={22}
              icon={11}
              onClick={speakForms}
              title="Dengarkan bentuknya"
            />
          </div>
        )}
        {!flip && !hidden && (
          <span className="text-[15px] text-ink-2">{id}</span>
        )}
        {!flip &&
          hidden &&
          revealLink("Tebak artinya dulu, lalu klik untuk lihat")}
        {(!flip || !hidden) && (
          <span className="font-serif text-[17px] leading-[1.4] text-pretty text-ink italic">
            {ex}
          </span>
        )}
        {!hidden && !!ex && !!idOf(ex) && (
          <span className="-mt-1 text-[13.5px] leading-[1.45] text-pretty text-muted">
            {idOf(ex)}
          </span>
        )}
        {!!syn && syn !== "—" && (
          <span className="text-[13px] text-muted">
            <span className="font-semibold text-green">Lebih natural: </span>
            {syn}
          </span>
        )}

        {hasNoteFor && noteOpen && !hidden && !note && (
          <span className="mt-1.5 text-[13px] text-muted">
            Memuat penjelasan…
          </span>
        )}
        {!!note && noteOpen && !hidden && (
          <div className="mt-1.5 flex flex-col gap-3.5 rounded-lg border border-line bg-sand px-4 py-3.5">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[11px] tracking-[0.08em] text-green">
                INTI
              </span>
              <span className="text-[14.5px] leading-[1.55] text-pretty text-ink">
                {note.core}
              </span>
            </div>
            {!!note.forms?.length && (
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[11px] tracking-[0.08em] text-green">
                  BENTUK
                </span>
                <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3.5 gap-y-1">
                  {note.forms.map(([a, b], i) => (
                    <div key={i} className="contents">
                      <span className="text-[13px] whitespace-nowrap text-muted">
                        {a}
                      </span>
                      <span className="font-mono text-[13px] text-ink">
                        {b}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!!note.use?.length && (
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[11px] tracking-[0.08em] text-green">
                  KAPAN DIPAKAI
                </span>
                <div className="flex flex-col gap-1.5">
                  {note.use.map(([e, i2], i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-baseline gap-2.5">
                        <span className="font-serif text-base leading-[1.4] text-ink italic">
                          {e}
                        </span>
                        <SpeakButton
                          size={22}
                          icon={11}
                          text={e}
                          className="self-center"
                        />
                        {!!i2 && i2 !== idOf(e) && (
                          <span className="font-mono text-[11px] tracking-[0.04em] text-faint">
                            {i2}
                          </span>
                        )}
                      </div>
                      {!!(idOf(e) || i2) && (
                        <span className="text-[13px] text-muted">
                          {idOf(e) || i2}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!!note.traps?.length && (
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[11px] tracking-[0.08em] text-red">
                  JEBAKAN UMUM
                </span>
                <div className="flex flex-col gap-1.5">
                  {note.traps.map(([bad, good, why], i) => (
                    <div key={i} className="flex flex-col gap-px">
                      <div className="flex flex-wrap items-baseline gap-2 text-sm">
                        {!!bad && (
                          <span
                            className={classNames(
                              "text-red",
                              good && "line-through",
                            )}
                          >
                            {good ? "✗ " : ""}
                            {bad}
                          </span>
                        )}
                        {!!good && (
                          <span className="font-semibold text-green">
                            ✓ {good}
                          </span>
                        )}
                      </div>
                      {!!why && (
                        <span className="text-[12.5px] text-muted">{why}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!!note.see?.length && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] tracking-[0.08em] text-muted">
                  LIHAT JUGA
                </span>
                {note.see.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => jumpToWord(s)}
                    className="cursor-pointer rounded-full border border-line-2 bg-card px-2.5 py-[3px] font-sans text-[13px] text-green hover:border-green"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {showOwn && (
          <div className="mt-1 flex flex-col gap-[5px]">
            <div className="flex items-center gap-2">
              <input
                value={val}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                placeholder="Tulis satu kalimatmu sendiri dengan kata ini, lalu Enter…"
                className="min-w-0 flex-1 rounded-md border-[1.5px] border-dashed border-line-2 bg-transparent px-2.5 py-[7px] font-sans text-[13.5px] text-ink outline-none"
              />
              {hasOwn && (
                <>
                  <SpeakButton
                    size={30}
                    text={own}
                    title="Dengarkan kalimatku"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setOwnSentence(k, "");
                      setDraft(null);
                      setOpen(false);
                    }}
                    title="Hapus kalimatku"
                    className="cursor-pointer border-0 border-b border-dotted border-red bg-transparent p-0 text-xs whitespace-nowrap text-red"
                  >
                    hapus
                  </button>
                </>
              )}
            </div>
            {hasOwn && !dirty && (
              <span className="font-mono text-[11px] text-green">
                ✓ tersimpan · dipakai saat ulangan
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <button
          type="button"
          onClick={() => toggleKnown(k)}
          title="Tandai hafal"
          className={classNames(
            "flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 font-sans text-[12.5px] font-semibold whitespace-nowrap transition-colors",
            kn
              ? "border-green bg-green text-card"
              : "border-line-2 bg-transparent text-ink hover:border-ink",
          )}
        >
          {kn ? "✓ Hafal" : "Tandai hafal"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="cursor-pointer border-0 border-b border-dotted border-faint bg-transparent p-0 font-sans text-[11.5px] text-muted"
        >
          {own
            ? open
              ? "tutup kalimatku"
              : "✎ kalimatku"
            : open
              ? "tutup"
              : "+ kalimatku"}
        </button>
        {isMine && (
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={edit}
              className="cursor-pointer border-0 border-b border-dotted border-green bg-transparent p-0 font-sans text-[11.5px] text-green"
            >
              Ubah
            </button>
            <button
              type="button"
              onClick={remove}
              className="cursor-pointer border-0 border-b border-dotted border-red bg-transparent p-0 font-sans text-[11.5px] text-red"
            >
              Hapus
            </button>
          </div>
        )}
        {kn && srs && (
          <span className="font-mono text-[10.5px] text-faint">
            {srs.due <= T0
              ? "ulang hari ini"
              : "ulang dalam " + (srs.due - T0) + " hari"}
          </span>
        )}
      </div>
    </article>
  );
});

WordCard.displayName = "WordCard";

export default WordCard;
