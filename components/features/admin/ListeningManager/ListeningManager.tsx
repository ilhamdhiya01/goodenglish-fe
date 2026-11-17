"use client";

import classNames from "classnames";
import React, { useMemo, useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import FieldLabel from "@/components/ui/field-label";
import Input from "@/components/ui/input";
import { FIELD_CLASS } from "@/components/ui/input/Input";
import Pill from "@/components/ui/pill";
import Select from "@/components/ui/select";
import { LEVEL_OPTIONS } from "@/const/access.constant";
import { levelData } from "@/lib/helpers/level-data.helper";
import { contrastVoice } from "@/lib/helpers/listening.helper";
import { speakAll, stopSpeaking } from "@/lib/helpers/speech.helper";
import { tenseOfWeek, wordsOfWeek } from "@/lib/helpers/week-words.helper";
import { useAdminListening } from "@/lib/hooks/listening/useListening";
import type {
  ListeningItem,
  ListeningLine,
  ListeningQuestion,
} from "@/lib/types/listening.types";
import type { LevelId } from "@/lib/types/session.types";
import { confirmDialog } from "@/stores/useConfirmStore";
import { useTtsStore } from "@/stores/useTtsStore";

const LETTERS = ["A", "B", "C", "D"];

/** Plays an item with two voices (preview). */
const usePreview = () => {
  const voice = useTtsStore((s) => s.voice);
  return (item: Pick<ListeningItem, "lines">) =>
    void speakAll(
      item.lines.map((l) => ({
        text: l.text,
        voice: l.speaker === "B" ? contrastVoice(voice) : voice,
      })),
    );
};

interface Draft {
  title: string;
  type: "dialog" | "monolog";
  lines: ListeningLine[];
  questions: ListeningQuestion[];
}

// Edit one item; the backend re-checks every rule (40–120 words, A/B, 3×4).
const ItemEditor = ({
  item,
  saving,
  onSave,
  onCancel,
}: {
  item: ListeningItem;
  saving: boolean;
  onSave: (d: Draft) => void;
  onCancel: () => void;
}) => {
  const [d, setD] = useState<Draft>({
    title: item.title,
    type: item.type,
    lines: item.lines.map((l) => ({ ...l })),
    questions: item.questions.map((q) => ({ ...q, options: [...q.options] })),
  });
  const words = d.lines.reduce(
    (n, l) => n + (l.text.match(/[A-Za-z0-9]+(?:'[A-Za-z]+)?/g) ?? []).length,
    0,
  );
  const setLine = (i: number, l: Partial<ListeningLine>) =>
    setD({
      ...d,
      lines: d.lines.map((x, j) => (j === i ? { ...x, ...l } : x)),
    });
  const setQ = (i: number, q: Partial<ListeningQuestion>) =>
    setD({
      ...d,
      questions: d.questions.map((x, j) => (j === i ? { ...x, ...q } : x)),
    });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(d);
      }}
    >
      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <FieldLabel label="Judul">
          <Input
            value={d.title}
            maxLength={160}
            onChange={(e) => setD({ ...d, title: e.target.value })}
          />
        </FieldLabel>
        <FieldLabel label="Jenis">
          <Select
            value={d.type}
            onChange={(e) =>
              setD({ ...d, type: e.target.value as Draft["type"] })
            }
          >
            <option value="dialog">Dialog (A &amp; B)</option>
            <option value="monolog">Monolog (A)</option>
          </Select>
        </FieldLabel>
      </div>

      <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
        <legend className="mb-1 p-0 text-[13px] font-extrabold text-ink-2">
          Baris audio ·{" "}
          <span className={words < 40 || words > 120 ? "text-bad" : "text-ok"}>
            {words} kata
          </span>{" "}
          (harus 40–120)
        </legend>
        {d.lines.map((l, i) => (
          <div key={i} className="flex items-start gap-2">
            <select
              aria-label={`Penutur baris ${i + 1}`}
              value={l.speaker}
              onChange={(e) =>
                setLine(i, { speaker: e.target.value as "A" | "B" })
              }
              className={classNames(FIELD_CLASS, "w-16 shrink-0")}
            >
              <option value="A">A</option>
              <option value="B">B</option>
            </select>
            <textarea
              aria-label={`Teks baris ${i + 1}`}
              rows={2}
              value={l.text}
              maxLength={600}
              onChange={(e) => setLine(i, { text: e.target.value })}
              className={classNames(FIELD_CLASS, "min-h-12 resize-y")}
            />
            <Button
              size="sm"
              variant="danger"
              aria-label={`Hapus baris ${i + 1}`}
              onClick={() =>
                setD({ ...d, lines: d.lines.filter((_, j) => j !== i) })
              }
            >
              ✕
            </Button>
          </div>
        ))}
        <Button
          size="sm"
          className="self-start"
          onClick={() =>
            setD({
              ...d,
              lines: [
                ...d.lines,
                {
                  speaker:
                    d.type === "dialog" && d.lines.at(-1)?.speaker === "A"
                      ? "B"
                      : "A",
                  text: "",
                },
              ],
            })
          }
        >
          + Baris
        </Button>
      </fieldset>

      {d.questions.map((q, qi) => (
        <fieldset
          key={qi}
          className="m-0 flex min-w-0 flex-col gap-2 rounded-xl border-2 border-line p-3"
        >
          <legend className="px-1 text-[13px] font-extrabold text-ink-2">
            Soal {qi + 1}
          </legend>
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
                name={`answer-${item.id}-${qi}`}
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
          <Input
            aria-label={`Penjelasan soal ${qi + 1}`}
            placeholder="Penjelasan (bahasa Indonesia)"
            value={q.explanationId}
            maxLength={400}
            onChange={(e) => setQ(qi, { explanationId: e.target.value })}
          />
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

// Admin › Kelola › Menyimak: the "Dengar & jawab" question bank. Drafts
// are generated with Gemini from the week's words and tense, checked here,
// then published. Learners only ever see published items.
const ListeningManager = () => {
  const [level, setLevel] = useState<LevelId>("pre");
  const plan = useMemo(() => levelData(level, []).plan, [level]);
  const [week, setWeek] = useState(1);
  const [count, setCount] = useState(1);
  const [type, setType] = useState<"dialog" | "monolog" | "mixed">("dialog");
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const preview = usePreview();
  const L = useAdminListening(level, week);
  const items = L.items ?? [];
  const published = items.filter((i) => i.status === "published").length;
  const words = useMemo(() => wordsOfWeek(level, week), [level, week]);
  const tense = useMemo(() => tenseOfWeek(level, week), [level, week]);

  const generate = () =>
    L.generate({ level, week, count, type, words, tense }).catch(() => {});

  const remove = async (item: ListeningItem) => {
    const ok = await confirmDialog({
      title: `Hapus "${item.title}"?`,
      message:
        item.status === "published"
          ? "Soal ini sudah terbit; pelajar tidak akan melihatnya lagi."
          : "Draf ini akan dihapus.",
      confirmLabel: "Hapus",
      tone: "danger",
    });
    if (ok) L.remove(item.id).catch(() => {});
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
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
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
          <FieldLabel label="Jumlah draf">
            <Select value={count} onChange={(e) => setCount(+e.target.value)}>
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </FieldLabel>
          <FieldLabel label="Jenis">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              <option value="dialog">Dialog</option>
              <option value="monolog">Monolog</option>
              <option value="mixed">Campur</option>
            </Select>
          </FieldLabel>
        </div>
        <span className="text-[13px] leading-[18px] font-semibold text-ink-2">
          Gemini memakai {words.length} kata minggu ini
          {tense ? ` dan fokus "${tense.name}"` : ""}. Draf tidak terlihat
          pelajar sampai diterbitkan.
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="green"
            disabled={L.isGenerating || !words.length}
            onClick={() => void generate()}
          >
            {L.isGenerating ? "Membuat draf…" : `Generate ${count} draf`}
          </Button>
          <span className="text-sm font-bold text-ink-2" aria-live="polite">
            Minggu {week}: {published} terbit · {items.length - published} draf
          </span>
        </div>
      </Card>

      {L.isLoading ? (
        <span className="text-sm font-bold text-ink-2">Memuat…</span>
      ) : L.isError ? (
        <span className="text-sm font-bold text-bad" role="alert">
          Daftar soal gagal dimuat.
        </span>
      ) : !items.length ? (
        <Card tone="dashed">
          <span className="text-sm font-bold text-ink-2">
            Belum ada soal untuk minggu ini. Tekan Generate untuk membuat draf.
          </span>
        </Card>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {items.map((it) => (
            <li key={it.id}>
              <Card className="gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[15px] font-black text-ink">
                      {it.title}
                    </span>
                    <span className="text-[12.5px] font-semibold text-ink-2">
                      {it.type === "dialog" ? "Dialog" : "Monolog"} ·{" "}
                      {it.wordCount} kata · {it.createdBy ?? "—"}
                    </span>
                  </div>
                  <span
                    className={classNames(
                      "rounded-full border-2 px-2.5 py-0.5 text-[12px] font-extrabold",
                      it.status === "published"
                        ? "border-ok-line bg-ok-bg text-ok"
                        : "border-line bg-sunken text-ink-2",
                    )}
                  >
                    {it.status === "published" ? "Terbit" : "Draf"}
                  </span>
                </div>

                {editing === it.id ? (
                  <ItemEditor
                    item={it}
                    saving={L.isSaving}
                    onCancel={() => setEditing(null)}
                    onSave={(d) =>
                      void L.update({ id: it.id, body: d })
                        .then(() => setEditing(null))
                        .catch(() => {})
                    }
                  />
                ) : (
                  <>
                    {open === it.id && (
                      <div className="flex flex-col gap-3">
                        <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
                          {it.lines.map((l, i) => (
                            <li
                              key={i}
                              className="flex gap-2 text-[14px] leading-5"
                            >
                              <span className="w-5 shrink-0 font-black text-ink-3">
                                {l.speaker}
                              </span>
                              <span className="text-ink">{l.text}</span>
                            </li>
                          ))}
                        </ol>
                        {it.questions.map((q, qi) => (
                          <div key={qi} className="flex flex-col gap-1">
                            <span className="text-[14px] font-extrabold text-ink">
                              {qi + 1}. {q.question}
                            </span>
                            {q.options.map((o, oi) => (
                              <span
                                key={oi}
                                className={classNames(
                                  "pl-4 text-[13.5px]",
                                  oi === q.answerIndex
                                    ? "font-extrabold text-ok"
                                    : "text-ink-2",
                                )}
                              >
                                {LETTERS[oi]}. {o}
                                {oi === q.answerIndex && " ✓"}
                              </span>
                            ))}
                            <span className="pl-4 text-[12.5px] text-ink-3">
                              {q.explanationId}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => preview(it)}>
                        Putar
                      </Button>
                      <Button
                        size="sm"
                        aria-expanded={open === it.id}
                        onClick={() => {
                          stopSpeaking();
                          setOpen(open === it.id ? null : it.id);
                        }}
                      >
                        {open === it.id ? "Tutup isi" : "Lihat isi"}
                      </Button>
                      <Button size="sm" onClick={() => setEditing(it.id)}>
                        Ubah
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          it.status === "published" ? "outline" : "green"
                        }
                        disabled={L.busyId === it.id}
                        onClick={() =>
                          void L.setPublished({
                            id: it.id,
                            published: it.status !== "published",
                          }).catch(() => {})
                        }
                      >
                        {it.status === "published"
                          ? "Tarik ke draf"
                          : "Terbitkan"}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={L.busyId === it.id}
                        onClick={() => void remove(it)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ListeningManager;
