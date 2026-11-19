"use client";

import React, { useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import FieldLabel from "@/components/ui/field-label";
import Input from "@/components/ui/input";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import { LEVEL_OPTIONS } from "@/const/access.constant";
import { useAdminWordMeanings } from "@/lib/hooks/reading/useReading";
import type { SavedWordMeaning } from "@/lib/types/reading.types";
import type { LevelId } from "@/lib/types/session.types";
import { confirmDialog } from "@/stores/useConfirmStore";

const Row = ({
  m,
  onSave,
  onRemove,
  saving,
}: {
  m: SavedWordMeaning;
  onSave: (body: { lemma: string; meaningId: string; pron: string }) => void;
  onRemove: () => void;
  saving: boolean;
}) => {
  const [edit, setEdit] = useState(false);
  const [lemma, setLemma] = useState(m.lemma);
  const [meaningId, setMeaningId] = useState(m.meaningId);
  const [pron, setPron] = useState(m.pron);

  return (
    <li className="flex flex-col gap-2 border-b-2 border-line py-3 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[15px] font-extrabold text-ink">
          {m.word}
          {m.lemma && m.lemma !== m.word && (
            <span className="font-bold text-ink-2"> → {m.lemma}</span>
          )}
          <span className="font-bold text-ink"> = {m.meaningId}</span>
          {m.pron && (
            <span className="font-semibold text-ink-2"> /{m.pron}/</span>
          )}
        </span>
        {!edit && (
          <span className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEdit(true)}>
              Ubah
            </Button>
            <Button size="sm" variant="outline" onClick={onRemove}>
              Hapus
            </Button>
          </span>
        )}
      </div>
      <span className="text-[13px] leading-[18px] text-ink-2">
        {m.sentence ? `Kalimat: “${m.sentence}”` : "Tanpa kalimat (data lama)"}
      </span>
      {edit && (
        <div className="grid gap-2 md:grid-cols-3">
          <FieldLabel label="Bentuk dasar">
            <Input value={lemma} onChange={(e) => setLemma(e.target.value)} />
          </FieldLabel>
          <FieldLabel label="Arti">
            <Input
              value={meaningId}
              onChange={(e) => setMeaningId(e.target.value)}
            />
          </FieldLabel>
          <FieldLabel label="Ucapan">
            <Input value={pron} onChange={(e) => setPron(e.target.value)} />
          </FieldLabel>
          <span className="flex gap-2 md:col-span-3">
            <Button
              size="sm"
              variant="green"
              disabled={saving || !lemma.trim() || !meaningId.trim()}
              onClick={() => {
                onSave({ lemma, meaningId, pron });
                setEdit(false);
              }}
            >
              Simpan
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEdit(false)}>
              Batal
            </Button>
          </span>
        </div>
      )}
    </li>
  );
};

// Admin › Kelola › Bacaan › Arti kata: meanings the AI gave for words
// learners tapped (one per word and sentence), to correct or remove a wrong
// one. A removed meaning is asked again on the next tap.
const WordMeaningManager = () => {
  const [level, setLevel] = useState<LevelId>("pre");
  const [q, setQ] = useState("");
  const M = useAdminWordMeanings(level, q);
  const list = M.meanings ?? [];

  const remove = async (m: SavedWordMeaning) => {
    const ok = await confirmDialog({
      title: `Hapus arti "${m.word}"?`,
      message:
        "Pelajar berikutnya yang mengetuk kata ini di kalimat yang sama akan mendapat arti baru dari AI.",
      confirmLabel: "Hapus",
      tone: "danger",
    });
    if (ok) M.remove(m.id).catch(() => {});
  };

  return (
    <Card pad="lg" className="gap-4">
      <div className="flex flex-col gap-1">
        <SectionLabel tone="green">ARTI KATA DARI AI</SectionLabel>
        <span className="text-sm leading-5 text-ink-2">
          Arti kata yang dicari pelajar saat membaca, satu per kalimat. Ubah
          yang kurang tepat, atau hapus supaya dicari ulang.
        </span>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Level">
        {LEVEL_OPTIONS.map((l) => (
          <Pill key={l.id} on={level === l.id} onClick={() => setLevel(l.id)}>
            {l.label}
          </Pill>
        ))}
      </div>
      <FieldLabel label="Cari kata">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="mis. went"
        />
      </FieldLabel>
      {M.isLoading ? (
        <span className="text-[13px] font-bold text-ink-2">Memuat…</span>
      ) : M.isError ? (
        <span className="text-sm font-bold text-bad">
          Gagal memuat arti kata.
        </span>
      ) : list.length === 0 ? (
        <span className="text-sm font-bold text-ink-2">
          Belum ada arti kata tersimpan di level ini.
        </span>
      ) : (
        <ul aria-label="Arti kata tersimpan" className="flex flex-col">
          {list.map((m) => (
            <Row
              key={`${m.id}:${m.updatedAt}`}
              m={m}
              saving={M.isSaving}
              onSave={(body) =>
                void M.update({ id: m.id, body }).catch(() => {})
              }
              onRemove={() => void remove(m)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
};

export default WordMeaningManager;
