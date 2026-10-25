"use client";

import React, { useEffect, useMemo, useState } from "react";

import { Ask } from "@/components/features/ask";
import Card from "@/components/ui/card";
import Pill from "@/components/ui/pill";
import { PRACTICE, type PracticeTopic } from "@/const/practice-sets.constant";
import { bankGen, type BankItem } from "@/lib/helpers/bank-practice.helper";
import type { PracticeStage } from "@/lib/types/ask-practice.types";
import { useAskPracticeStore } from "@/stores/useAskPracticeStore";
import { usePracticeSessionStore } from "@/stores/usePracticeSessionStore";

// Bank soal per topik dimuat saat sub-tabnya dibuka (chunk terpisah), bukan di bundle awal.
const LOAD: Record<PracticeTopic, () => Promise<{ default: unknown }>> = {
  whb: () => import("@/lib/content/practice/whb.json"),
  irr: () => import("@/lib/content/practice/irr.json"),
  prep: () => import("@/lib/content/practice/prep.json"),
  bedo: () => import("@/lib/content/practice/bedo.json"),
  tense: () => import("@/lib/content/practice/tense.json"),
  conj: () => import("@/lib/content/practice/conj.json"),
  thit: () => import("@/lib/content/practice/thit.json"),
};

const STAGES: [PracticeStage, string, string][] = [
  [
    "mc",
    "1 · Pilihan ganda",
    "Tahap 1. Pilih kalimat yang benar; opsi salahnya adalah kesalahan khas. Lanjut ke tahap 2 saat akurasi ≥ 80%.",
  ],
  [
    "order",
    "2 · Susun kata",
    "Tahap 2. Lihat artinya, lalu susun kalimat Inggrisnya dari kartu kata. Hati-hati: ada beberapa kartu pengecoh yang tidak dipakai.",
  ],
  [
    "type",
    "3 · Ketik isian",
    "Tahap 3. Ketik isi bagian kosong saja, tanpa pilihan. Tulis — kalau tidak perlu kata apa pun. Huruf besar dan singkatan (I've, don't) tidak dihitung salah.",
  ],
];

// Latihan soal dari bank tertulis untuk satu sub-tab: pilih set, lalu latihan tiga tahap.
const BankPractice = React.memo(({ topic }: { topic: PracticeTopic }) => {
  const { intro, sets } = PRACTICE[topic];
  const [bank, setBank] = useState<BankItem[] | null>(null);
  // Set terakhir yang dipilih per topik diingat (store), supaya kembali ke sub-tab ini membuka set & sesi yang sama.
  const saved = usePracticeSessionStore((s) => s.sets[topic]);
  const setTopicSet = usePracticeSessionStore((s) => s.setTopicSet);
  const set = sets.some((x) => x[0] === saved) ? saved! : sets[0][0];
  const setSet = (id: string) => setTopicSet(topic, id);
  const stats = useAskPracticeStore((s) => s.stats);

  useEffect(() => {
    let alive = true;
    setBank(null);
    LOAD[topic]().then((m) => alive && setBank(m.default as BankItem[]));
    return () => {
      alive = false;
    };
  }, [topic, sets]);

  const gen = useMemo(() => (bank ? bankGen(bank) : null), [bank]);
  const total = (id: string) => (bank || []).filter((b) => b.set === id).length;
  const meta = sets.find((s) => s[0] === set) || sets[0];

  return (
    <Card tone="ink" pad="lg" className="gap-3.5">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs tracking-[0.06em] text-green">
          LATIHAN SOAL · {sets.length} SET
        </span>
        <span className="text-sm leading-[1.5] text-pretty text-ink-2">
          {intro}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {sets.map(([id, no, label]) => (
          <Pill key={id} size="sm" on={set === id} onClick={() => setSet(id)}>
            {no} · {label}
            {bank && (
              <span className="font-mono text-[11px] opacity-70">
                {Object.keys(stats[id]?.done || {}).length}/{total(id)}
              </span>
            )}
          </Pill>
        ))}
      </div>
      <span className="text-[13.5px] leading-[1.5] text-ink-3">
        <b>{meta[2]}.</b> {meta[3]}
      </span>
      {gen ? (
        <Ask.AskPractice
          key={set}
          rule={set}
          ruleNo={meta[1]}
          gen={gen}
          title={`${total(set)} soal di set ini, 20 per sesi, yang sudah kamu jawab benar tidak diulang`}
          stages={STAGES}
          placeholder="Ketik isian bagian kosong, lalu Enter…"
        />
      ) : (
        <span className="font-mono text-xs text-muted">Memuat soal…</span>
      )}
    </Card>
  );
});

BankPractice.displayName = "BankPractice";

export default BankPractice;
