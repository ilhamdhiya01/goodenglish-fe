"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import {
  LuArchive,
  LuArchiveRestore,
  LuBookOpen,
  LuTrash2,
} from "react-icons/lu";

import Jalak from "@/components/brand/Jalak";
import RuleSheet, {
  sectionOfMistake,
} from "@/components/features/review/RuleSheet";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import FieldLabel from "@/components/ui/field-label";
import SectionLabel from "@/components/ui/section-label";
import Select from "@/components/ui/select";
import SpeakButton from "@/components/ui/speak-button";
import {
  categoryOf,
  learnHref,
  MISTAKE_CATEGORIES,
} from "@/const/mistake-categories.constant";
import { formatDate } from "@/lib/helpers/date.helper";
import { practiceOf } from "@/lib/helpers/practice-ref.helper";
import {
  MISTAKE_SOURCES,
  type MistakeRecord,
  type MistakeStatus,
} from "@/lib/types/mistake.types";
import { confirmDialog } from "@/stores/useConfirmStore";
import { useMistakeStore } from "@/stores/useMistakeStore";

const STATUS_LABEL: Record<MistakeStatus, string> = {
  active: "Aktif",
  mastered: "Sudah dikuasai",
  archived: "Diarsipkan",
};

/** Active mistakes per category, most first. */
export const topCategories = (items: MistakeRecord[], n: number) => {
  const m = new Map<string, number>();
  items
    .filter((x) => x.status === "active")
    .forEach((x) => m.set(x.category, (m.get(x.category) ?? 0) + 1));
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n);
};

const LEARN_CLASS =
  "inline-flex min-h-11 items-center gap-1.5 text-sm font-extrabold text-accent-edge focus-ring hover:underline";

const MistakeCard = ({ m }: { m: MistakeRecord }) => {
  const setStatus = useMistakeStore((s) => s.setStatus);
  const remove = useMistakeStore((s) => s.remove);
  const cat = categoryOf(m.category);
  const [ruleOpen, setRuleOpen] = useState(false);
  // Same sheet as Ulang's "Lihat aturannya" when there is something to show
  // (the rule, its Cheat sheet section, or the grammar practice set).
  const hasSheet = !!practiceOf(m) || !!sectionOfMistake(m);
  return (
    <Card className="gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-chip px-2.5 py-0.5 text-[12px] font-extrabold text-ink-2">
          {cat.label}
        </span>
        <span className="text-[12.5px] font-bold text-ink-2">
          {m.source} · {formatDate(m.lastAt)}
          {m.count > 1 && ` · terjadi ${m.count} kali`}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[15px] leading-[21px] font-semibold text-ink-2">
          <span aria-hidden className="mr-1.5 font-black text-bad">
            ✕
          </span>
          <span className="sr-only">Jawabanku: </span>
          <s className="decoration-bad decoration-2">{m.wrong}</s>
        </span>
        <span className="flex items-start gap-2 text-base leading-[22px] font-extrabold text-ink">
          <span aria-hidden className="font-black text-ok">
            ✓
          </span>
          <span className="sr-only">Yang benar: </span>
          <span className="min-w-0 flex-1">{m.correct}</span>
          <SpeakButton size={30} icon={14} text={m.correct} />
        </span>
      </div>
      {!!m.explanation_id && (
        <span className="text-[13.5px] leading-[19px] text-ink-2">
          {m.explanation_id}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {hasSheet ? (
          <button
            type="button"
            onClick={() => setRuleOpen(true)}
            className={`${LEARN_CLASS} cursor-pointer`}
          >
            <LuBookOpen aria-hidden size={15} />
            Pelajari aturannya
          </button>
        ) : (
          <Link href={learnHref(m.category)} className={LEARN_CLASS}>
            <LuBookOpen aria-hidden size={15} />
            Pelajari aturannya
          </Link>
        )}
        {m.status === "active" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setStatus(m.id, "archived")}
          >
            <LuArchive aria-hidden size={14} />
            Arsipkan
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setStatus(m.id, "active")}
          >
            <LuArchiveRestore aria-hidden size={14} />
            Aktifkan lagi
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            void confirmDialog({
              title: "Hapus dari Buku kesalahanku?",
              message:
                "Kartunya hilang dari sini dan dari Ulang. Kalau salah yang sama terulang, akan dicatat lagi.",
              confirmLabel: "Hapus",
              tone: "danger",
            }).then((ok) => ok && remove(m.id))
          }
        >
          <LuTrash2 aria-hidden size={14} />
          Hapus
        </Button>
      </div>
      {ruleOpen && <RuleSheet m={m} onClose={() => setRuleOpen(false)} />}
    </Card>
  );
};

// Kesalahan umum › Punyaku: "Buku kesalahanku", the learner's own mistakes
// from every feature, with the top categories and filters.
const MyMistakes = () => {
  const items = useMistakeStore((s) => s.items);
  const [cat, setCat] = useState("all");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState<MistakeStatus>("active");

  const active = items.filter((m) => m.status === "active").length;
  const mastered = items.filter((m) => m.status === "mastered").length;
  const top = useMemo(() => topCategories(items, 5), [items]);
  const max = top[0]?.[1] ?? 1;
  const list = items.filter(
    (m) =>
      m.status === status &&
      (cat === "all" || m.category === cat) &&
      (source === "all" || m.source === source),
  );

  if (!items.length) {
    return (
      <Card
        tone="dashed"
        className="max-w-[760px] items-center py-8 text-center"
      >
        <Jalak mood="senang" />
        <span className="text-[15px] font-extrabold text-ink">
          Buku kesalahanmu masih kosong.
        </span>
        <span className="max-w-[520px] text-sm leading-5 text-ink-2">
          Jawaban yang salah di latihan Panduan grammar, kuis Kesalahan umum,
          Dikte, Main peran, serta kalimat yang dicek Tanya AI otomatis tercatat
          di sini, lalu diulang di Ulang hari ini sampai kamu menguasainya.
        </span>
      </Card>
    );
  }

  return (
    <div className="flex max-w-[760px] flex-col gap-4">
      <Card className="gap-3">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <span className="text-2xl font-black text-ink tabular-nums">
            {active}
            <span className="ml-1.5 text-sm font-bold text-ink-2">
              kesalahan aktif
            </span>
          </span>
          <span className="text-sm font-bold text-ink-2 tabular-nums">
            {mastered} sudah dikuasai
          </span>
        </div>
        {!!top.length && (
          <div className="flex flex-col gap-2">
            <SectionLabel>KATEGORI TERBANYAK</SectionLabel>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {top.map(([id, n]) => (
                <li
                  key={id}
                  className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2.5 text-[13.5px] font-bold text-ink"
                >
                  <span className="truncate">{categoryOf(id).label}</span>
                  <span aria-hidden className="h-2.5 rounded-full bg-track">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${Math.max(6, (n / max) * 100)}%` }}
                    />
                  </span>
                  <span className="tabular-nums">{n}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <FieldLabel label="Kategori">
          <Select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">Semua kategori</option>
            {MISTAKE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <FieldLabel label="Sumber">
          <Select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="all">Semua sumber</option>
            {MISTAKE_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <FieldLabel label="Status">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as MistakeStatus)}
          >
            {(Object.keys(STATUS_LABEL) as MistakeStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </FieldLabel>
      </div>

      <span className="text-[13px] font-bold text-ink-2" aria-live="polite">
        {list.length} kesalahan
      </span>
      {list.length ? (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {list.map((m) => (
            <li key={m.id}>
              <MistakeCard m={m} />
            </li>
          ))}
        </ul>
      ) : (
        <Card tone="dashed" className="py-6 text-center">
          <span className="text-sm font-bold text-ink-2">
            Tidak ada kesalahan di filter ini.
          </span>
        </Card>
      )}
    </div>
  );
};

export default MyMistakes;
