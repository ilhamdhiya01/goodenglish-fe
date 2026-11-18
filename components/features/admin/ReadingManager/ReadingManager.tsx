"use client";

import classNames from "classnames";
import React, { useMemo, useState } from "react";
import { LuTriangleAlert } from "react-icons/lu";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import FieldLabel from "@/components/ui/field-label";
import Input from "@/components/ui/input";
import { FIELD_CLASS } from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import Select from "@/components/ui/select";
import { LEVEL_OPTIONS } from "@/const/access.constant";
import { levelData } from "@/lib/helpers/level-data.helper";
import { splitSentences, warningText } from "@/lib/helpers/reading.helper";
import { speakAll, stopSpeaking } from "@/lib/helpers/speech.helper";
import { tenseOfWeek, wordsOfWeek } from "@/lib/helpers/week-words.helper";
import { useAdminReading } from "@/lib/hooks/reading/useReading";
import {
  type GlossaryEntry,
  type ReadingParagraph,
  type ReadingQuestion,
  type ReadingSlot,
  type ReadingText,
  SLOT_WORDS,
} from "@/lib/types/reading.types";
import type { LevelId } from "@/lib/types/session.types";
import { confirmDialog } from "@/stores/useConfirmStore";

const LETTERS = ["A", "B", "C", "D"];
// All of the week's words, to count "≥ 8 week words" (the DTO allows 80).
const ALL_WORDS = 80;

const countWords = (ps: ReadingParagraph[]) =>
  ps.reduce(
    (n, p) => n + (p.en.match(/[A-Za-z0-9]+(?:['’][A-Za-z]+)?/g) ?? []).length,
    0,
  );

interface Draft {
  title: string;
  paragraphs: ReadingParagraph[];
  targetWords: string;
  glossary: GlossaryEntry[];
  questions: ReadingQuestion[];
}

const TYPE_LABEL: Record<ReadingQuestion["type"], string> = {
  mcq: "Pilihan ganda",
  true_false: "Benar / salah",
  find_word: "Temukan kata",
};

// Edit every field of a text; the backend re-checks the rules and
// recomputes the warnings.
const TextEditor = ({
  text,
  saving,
  onSave,
  onCancel,
}: {
  text: ReadingText;
  saving: boolean;
  onSave: (d: Draft) => void;
  onCancel: () => void;
}) => {
  const [d, setD] = useState<Draft>({
    title: text.title,
    paragraphs: text.paragraphs.map((p) => ({ ...p })),
    targetWords: text.targetWordsUsed.join(", "),
    glossary: text.glossary.map((g) => ({ ...g })),
    questions: text.questions.map((q) =>
      q.type === "mcq" ? { ...q, options: [...q.options] } : { ...q },
    ),
  });
  const [min, max] = SLOT_WORDS[text.slot];
  const words = countWords(d.paragraphs);
  const setP = (i: number, p: Partial<ReadingParagraph>) =>
    setD({
      ...d,
      paragraphs: d.paragraphs.map((x, j) => (j === i ? { ...x, ...p } : x)),
    });
  const setG = (i: number, g: Partial<GlossaryEntry>) =>
    setD({
      ...d,
      glossary: d.glossary.map((x, j) => (j === i ? { ...x, ...g } : x)),
    });
  const setQ = (i: number, q: Partial<ReadingQuestion>) =>
    setD({
      ...d,
      questions: d.questions.map((x, j) =>
        j === i ? ({ ...x, ...q } as ReadingQuestion) : x,
      ),
    });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(d);
      }}
    >
      <FieldLabel label="Judul">
        <Input
          value={d.title}
          maxLength={160}
          onChange={(e) => setD({ ...d, title: e.target.value })}
        />
      </FieldLabel>

      <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
        <legend className="mb-1 p-0 text-[13px] font-extrabold text-ink-2">
          Paragraf ·{" "}
          <span className={words < min || words > max ? "text-bad" : "text-ok"}>
            {words} kata
          </span>{" "}
          (Teks {text.slot}: {min}–{max})
        </legend>
        {d.paragraphs.map((p, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-xl border-2 border-line p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-extrabold text-ink-2">
                Paragraf {i + 1}
              </span>
              <Button
                size="sm"
                variant="danger"
                aria-label={`Hapus paragraf ${i + 1}`}
                onClick={() =>
                  setD({
                    ...d,
                    paragraphs: d.paragraphs.filter((_, j) => j !== i),
                  })
                }
              >
                ✕
              </Button>
            </div>
            <textarea
              aria-label={`Paragraf ${i + 1} (Inggris)`}
              rows={4}
              value={p.en}
              maxLength={3000}
              onChange={(e) => setP(i, { en: e.target.value })}
              className={classNames(FIELD_CLASS, "min-h-24 resize-y")}
            />
            <textarea
              aria-label={`Paragraf ${i + 1} (terjemahan)`}
              rows={3}
              value={p.id}
              maxLength={3000}
              onChange={(e) => setP(i, { id: e.target.value })}
              className={classNames(FIELD_CLASS, "min-h-20 resize-y")}
            />
          </div>
        ))}
        {d.paragraphs.length < 10 && (
          <Button
            size="sm"
            className="self-start"
            onClick={() =>
              setD({ ...d, paragraphs: [...d.paragraphs, { en: "", id: "" }] })
            }
          >
            + Paragraf
          </Button>
        )}
      </fieldset>

      <FieldLabel label="Kata target yang dipakai (pisahkan dengan koma)">
        <Input
          value={d.targetWords}
          onChange={(e) => setD({ ...d, targetWords: e.target.value })}
        />
      </FieldLabel>

      <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
        <legend className="mb-1 p-0 text-[13px] font-extrabold text-ink-2">
          Glosarium (kata sulit di luar kosakata minggu ini)
        </legend>
        {d.glossary.map((g, i) => (
          <div key={i} className="flex items-start gap-2">
            <input
              aria-label={`Glosarium ${i + 1}: kata`}
              value={g.word}
              maxLength={60}
              onChange={(e) => setG(i, { word: e.target.value })}
              className={classNames(FIELD_CLASS, "w-2/5")}
            />
            <input
              aria-label={`Glosarium ${i + 1}: arti`}
              value={g.meaningId}
              maxLength={200}
              onChange={(e) => setG(i, { meaningId: e.target.value })}
              className={FIELD_CLASS}
            />
            <Button
              size="sm"
              variant="danger"
              aria-label={`Hapus glosarium ${i + 1}`}
              onClick={() =>
                setD({ ...d, glossary: d.glossary.filter((_, j) => j !== i) })
              }
            >
              ✕
            </Button>
          </div>
        ))}
        {d.glossary.length < 20 && (
          <Button
            size="sm"
            className="self-start"
            onClick={() =>
              setD({
                ...d,
                glossary: [...d.glossary, { word: "", meaningId: "" }],
              })
            }
          >
            + Kata glosarium
          </Button>
        )}
      </fieldset>

      {d.questions.map((q, qi) => (
        <fieldset
          key={qi}
          className="m-0 flex min-w-0 flex-col gap-2 rounded-xl border-2 border-line p-3"
        >
          <legend className="px-1 text-[13px] font-extrabold text-ink-2">
            Soal {qi + 1} · {TYPE_LABEL[q.type]}
          </legend>
          {q.type === "mcq" && (
            <>
              <Input
                aria-label={`Pertanyaan ${qi + 1}`}
                value={q.question}
                maxLength={300}
                onChange={(e) => setQ(qi, { question: e.target.value })}
              />
              {q.options.map((o, oi) => (
                <label key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`answer-${text.id}-${qi}`}
                    checked={q.answerIndex === oi}
                    onChange={() => setQ(qi, { answerIndex: oi })}
                    aria-label={`Pilihan ${LETTERS[oi]} jawaban benar`}
                    className="h-5 w-5 shrink-0 cursor-pointer accent-accent focus-ring"
                  />
                  <span className="w-4 text-xs font-black text-ink-2">
                    {LETTERS[oi]}
                  </span>
                  <input
                    aria-label={`Soal ${qi + 1} pilihan ${LETTERS[oi]}`}
                    value={o}
                    maxLength={200}
                    onChange={(e) =>
                      setQ(qi, {
                        options: q.options.map((x, j) =>
                          j === oi ? e.target.value : x,
                        ),
                      })
                    }
                    className={FIELD_CLASS}
                  />
                </label>
              ))}
            </>
          )}
          {q.type === "true_false" && (
            <>
              <Input
                aria-label={`Pernyataan ${qi + 1}`}
                value={q.statement}
                maxLength={300}
                onChange={(e) => setQ(qi, { statement: e.target.value })}
              />
              <div
                className="flex gap-4"
                role="radiogroup"
                aria-label={`Kunci soal ${qi + 1}`}
              >
                {[true, false].map((v) => (
                  <label
                    key={String(v)}
                    className="flex min-h-11 items-center gap-2 text-sm font-bold text-ink"
                  >
                    <input
                      type="radio"
                      name={`tf-${text.id}-${qi}`}
                      checked={q.answer === v}
                      onChange={() => setQ(qi, { answer: v })}
                      className="h-5 w-5 cursor-pointer accent-accent focus-ring"
                    />
                    {v ? "Benar" : "Salah"}
                  </label>
                ))}
              </div>
            </>
          )}
          {q.type === "find_word" ? (
            <>
              <Input
                aria-label={`Petunjuk soal ${qi + 1}`}
                value={q.promptId}
                maxLength={300}
                onChange={(e) => setQ(qi, { promptId: e.target.value })}
              />
              <Input
                aria-label={`Jawaban soal ${qi + 1}`}
                placeholder="Kata persis seperti di teks"
                value={q.answer}
                maxLength={60}
                onChange={(e) => setQ(qi, { answer: e.target.value })}
              />
            </>
          ) : (
            <Input
              aria-label={`Penjelasan soal ${qi + 1}`}
              placeholder="Penjelasan (bahasa Indonesia)"
              value={q.explanationId}
              maxLength={400}
              onChange={(e) => setQ(qi, { explanationId: e.target.value })}
            />
          )}
        </fieldset>
      ))}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="green" disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button onClick={onCancel}>Batal</Button>
      </div>
    </form>
  );
};

const Preview = ({ text }: { text: ReadingText }) => (
  <div className="flex flex-col gap-3">
    {text.paragraphs.map((p, i) => (
      <div key={i} className="flex flex-col gap-1">
        <p className="m-0 text-[14.5px] leading-[22px] text-ink">{p.en}</p>
        <p className="m-0 text-[13px] leading-[19px] text-ink-2">{p.id}</p>
      </div>
    ))}
    <span className="text-[13px] font-bold text-ink-2">
      Kata target: {text.targetWordsUsed.join(", ") || "—"}
    </span>
    {!!text.glossary.length && (
      <span className="text-[13px] font-bold text-ink-2">
        Glosarium:{" "}
        {text.glossary.map((g) => `${g.word} (${g.meaningId})`).join(", ")}
      </span>
    )}
    {text.questions.map((q, qi) => (
      <div key={qi} className="flex flex-col gap-1">
        <span className="text-[14px] font-extrabold text-ink">
          {qi + 1}.{" "}
          {q.type === "mcq"
            ? q.question
            : q.type === "true_false"
              ? `B/S: ${q.statement}`
              : q.promptId}
        </span>
        {q.type === "mcq" &&
          q.options.map((o, oi) => (
            <span
              key={oi}
              className={classNames(
                "pl-4 text-[13.5px]",
                oi === q.answerIndex ? "font-extrabold text-ok" : "text-ink-2",
              )}
            >
              {LETTERS[oi]}. {o}
              {oi === q.answerIndex && " ✓"}
            </span>
          ))}
        {q.type === "true_false" && (
          <span className="pl-4 text-[13.5px] font-extrabold text-ok">
            Kunci: {q.answer ? "Benar" : "Salah"}
          </span>
        )}
        {q.type === "find_word" ? (
          <span className="pl-4 text-[13.5px] font-extrabold text-ok">
            Jawaban: {q.answer}
          </span>
        ) : (
          <span className="pl-4 text-[12.5px] text-ink-3">
            {q.explanationId}
          </span>
        )}
      </div>
    ))}
  </div>
);

// Admin › Kelola › Bacaan: two texts per level and week (A 150–200 words,
// B 200–300). Drafts are written by Gemini from the week's words and tense,
// saved with warnings when they miss a rule, edited here, then published.
const ReadingManager = () => {
  const [level, setLevel] = useState<LevelId>("pre");
  const plan = useMemo(() => levelData(level, []).plan, [level]);
  const [week, setWeek] = useState(1);
  const [slot, setSlot] = useState<ReadingSlot>("A");
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const R = useAdminReading(level, week);
  const texts = R.texts ?? [];
  const published = texts.filter((t) => t.status === "published").length;
  const words = useMemo(() => wordsOfWeek(level, week), [level, week]);
  const allWords = useMemo(
    () => wordsOfWeek(level, week, ALL_WORDS),
    [level, week],
  );
  const tense = useMemo(() => tenseOfWeek(level, week), [level, week]);

  const generate = () =>
    R.generate({ level, week, slot, words, tense })
      .then((r) => setOpen(r.data.id))
      .catch(() => {});

  const publish = async (t: ReadingText) => {
    if (t.status === "published") {
      R.setPublished({ id: t.id, published: false }).catch(() => {});
      return;
    }
    if (t.warnings.length) {
      const ok = await confirmDialog({
        title: "Yakin terbitkan?",
        message:
          "Bacaan ini belum memenuhi syarat: " +
          t.warnings.map(warningText).join(" ") +
          " Pelajar akan langsung melihatnya.",
        confirmLabel: "Terbitkan",
      });
      if (!ok) return;
    }
    R.setPublished({ id: t.id, published: true }).catch(() => {});
  };

  const remove = async (t: ReadingText) => {
    const ok = await confirmDialog({
      title: `Hapus "${t.title}"?`,
      message:
        t.status === "published"
          ? "Bacaan ini sudah terbit; pelajar tidak akan melihatnya lagi."
          : "Draf ini akan dihapus.",
      confirmLabel: "Hapus",
      tone: "danger",
    });
    if (ok) R.remove(t.id).catch(() => {});
  };

  return (
    <section className="flex flex-col gap-5">
      <Card tone="line" pad="lg" className="gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Level">
          {LEVEL_OPTIONS.map((l) => (
            <Pill
              key={l.id}
              size="sm"
              on={level === l.id}
              onClick={() => {
                setLevel(l.id);
                setWeek(1);
                setEditing(null);
              }}
            >
              {l.label}
            </Pill>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <FieldLabel label="Minggu">
            <Select
              value={week}
              onChange={(e) => {
                setWeek(+e.target.value);
                setEditing(null);
              }}
            >
              {plan.map(([w, title, t]) => (
                <option key={w} value={w}>
                  Minggu {w} · {title}
                  {t ? ` · ${t}` : ""}
                </option>
              ))}
            </Select>
          </FieldLabel>
          <FieldLabel label="Teks">
            <Select
              value={slot}
              onChange={(e) => setSlot(e.target.value as ReadingSlot)}
            >
              <option value="A">Teks A · 150–200 kata</option>
              <option value="B">Teks B · 200–300 kata</option>
            </Select>
          </FieldLabel>
        </div>
        <span className="text-[13px] leading-[18px] font-semibold text-ink-2">
          Gemini memakai {words.length} kata minggu ini
          {tense ? ` dan fokus "${tense.name}"` : ""}, minimal 8 kata harus
          muncul. Draf tidak terlihat pelajar sampai diterbitkan.
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="green"
            disabled={R.isGenerating || !words.length}
            onClick={() => void generate()}
          >
            {R.isGenerating ? "Membuat draf…" : `Buat draf Teks ${slot}`}
          </Button>
          <span className="text-sm font-bold text-ink-2" aria-live="polite">
            Minggu {week}: {published} terbit · {texts.length - published} draf
          </span>
        </div>
      </Card>

      {R.isLoading ? (
        <span className="text-sm font-bold text-ink-2">Memuat…</span>
      ) : R.isError ? (
        <span className="text-sm font-bold text-bad" role="alert">
          Daftar bacaan gagal dimuat.
        </span>
      ) : !texts.length ? (
        <Card tone="dashed">
          <span className="text-sm font-bold text-ink-2">
            Belum ada bacaan untuk minggu ini. Pilih Teks A atau B, lalu tekan
            Buat draf.
          </span>
        </Card>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {texts.map((t) => (
            <li key={t.id}>
              <Card className="gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[15px] font-black text-ink">
                      {t.title}
                    </span>
                    <span className="text-[12.5px] font-semibold text-ink-2">
                      Teks {t.slot} · {t.wordCount} kata ·{" "}
                      {t.targetWordsUsed.length} kata target ·{" "}
                      {t.createdBy ?? "—"}
                    </span>
                  </div>
                  <span
                    className={classNames(
                      "rounded-full border-2 px-2.5 py-0.5 text-[12px] font-extrabold",
                      t.status === "published"
                        ? "border-ok-line bg-ok-bg text-ok"
                        : "border-line bg-sunken text-ink-2",
                    )}
                  >
                    {t.status === "published" ? "Terbit" : "Draf"}
                  </span>
                </div>

                {!!t.warnings.length && (
                  <div
                    className="flex items-start gap-2 rounded-lg border-2 border-bad-line bg-bad-bg px-3 py-2"
                    aria-label="Peringatan"
                  >
                    <LuTriangleAlert
                      aria-hidden
                      size={18}
                      className="mt-0.5 shrink-0 text-bad"
                    />
                    <ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-[13px] leading-[18px] font-bold text-ink">
                      {t.warnings.map((w, i) => (
                        <li key={i}>{warningText(w)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {editing === t.id && (
                  <Modal
                    label={`Ubah bacaan ${t.title}`}
                    size="lg"
                    onClose={() => setEditing(null)}
                  >
                    <Card pad="lg" className="gap-4">
                      <SectionLabel tone="green">
                        UBAH · {t.title.toUpperCase()}
                      </SectionLabel>
                      <TextEditor
                        text={t}
                        saving={R.isSaving}
                        onCancel={() => setEditing(null)}
                        onSave={(d) =>
                          void R.update({
                            id: t.id,
                            body: {
                              title: d.title,
                              paragraphs: d.paragraphs,
                              targetWordsUsed: d.targetWords
                                .split(",")
                                .map((w) => w.trim())
                                .filter(Boolean),
                              glossary: d.glossary.filter(
                                (g) => g.word.trim() && g.meaningId.trim(),
                              ),
                              questions: d.questions,
                              words: allWords,
                            },
                          })
                            .then(() => setEditing(null))
                            .catch(() => {})
                        }
                      />
                    </Card>
                  </Modal>
                )}
                {open === t.id && (
                  <Modal
                    label={`Isi bacaan ${t.title}`}
                    size="lg"
                    onClose={() => {
                      stopSpeaking();
                      setOpen(null);
                    }}
                  >
                    <Card pad="lg" className="gap-3">
                      <SectionLabel tone="green">
                        ISI · {t.title.toUpperCase()}
                      </SectionLabel>
                      <Preview text={t} />
                      <Button
                        size="sm"
                        className="self-start"
                        onClick={() => {
                          stopSpeaking();
                          setOpen(null);
                        }}
                      >
                        Tutup
                      </Button>
                    </Card>
                  </Modal>
                )}
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        void speakAll(
                          t.paragraphs.flatMap((p) => splitSentences(p.en)),
                        )
                      }
                    >
                      Putar
                    </Button>
                    <Button
                      size="sm"
                      aria-haspopup="dialog"
                      onClick={() => {
                        stopSpeaking();
                        setOpen(t.id);
                      }}
                    >
                      Lihat isi
                    </Button>
                    <Button
                      size="sm"
                      aria-haspopup="dialog"
                      onClick={() => setEditing(t.id)}
                    >
                      Ubah
                    </Button>
                    <Button
                      size="sm"
                      variant={t.status === "published" ? "outline" : "green"}
                      disabled={R.busyId === t.id}
                      onClick={() => void publish(t)}
                    >
                      {t.status === "published" ? "Sembunyikan" : "Terbitkan"}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={R.busyId === t.id}
                      onClick={() => void remove(t)}
                    >
                      Hapus
                    </Button>
                  </div>
                </>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ReadingManager;
