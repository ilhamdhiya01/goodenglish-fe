"use client";

import React, { useCallback, useMemo, useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import FieldLabel from "@/components/ui/field-label";
import Input from "@/components/ui/input";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import Select from "@/components/ui/select";
import TextButton from "@/components/ui/text-button";
import { LEVEL_OPTIONS } from "@/const/access.constant";
import { TYPES } from "@/const/vocab-types.constant";
import { flatten, guessType, levelData } from "@/lib/helpers/level-data.helper";
import type { LevelId } from "@/lib/types/session.types";
import type { SharedWord, SharedWordInput } from "@/lib/types/words.types";

const EMPTY: SharedWordInput = {
  level: "beginner",
  week: 1,
  type: "",
  en: "",
  meaning: "",
  pron: "",
  example: "",
};

interface SharedWordFormProps {
  title: string;
  submitLabel: string;
  /** Set when editing; also excluded from the duplicate check. */
  editing?: SharedWord;
  defaultLevel?: LevelId;
  /** All shared words, for the duplicate check. */
  words: SharedWord[];
  isSubmitting: boolean;
  onSubmit: (values: SharedWordInput) => void;
  onCancel: () => void;
}

// Tambah/ubah satu kata kosakata bersama. Kata tidak boleh dobel di level yang
// sama, baik terhadap kosakata bawaan app maupun kata bersama lain (backend
// hanya tahu yang kedua).
const SharedWordForm = React.memo(
  ({
    title,
    submitLabel,
    editing,
    defaultLevel,
    words,
    isSubmitting,
    onSubmit,
    onCancel,
  }: SharedWordFormProps) => {
    const [values, setValues] = useState<SharedWordInput>(
      editing ?? { ...EMPTY, level: defaultLevel ?? EMPTY.level },
    );
    const [err, setErr] = useState("");
    const set = (patch: Partial<SharedWordInput>) => {
      setValues((v) => ({ ...v, ...patch }));
      setErr("");
    };

    const bundled = useMemo(() => levelData(values.level, []), [values.level]);
    const weeks = bundled.plan.length
      ? bundled.plan.map(([n, t]) => [n, t] as const)
      : Array.from({ length: 12 }, (_, i) => [i + 1, ""] as const);
    const type = values.type || (values.en ? guessType(values.en) : "w");

    // Progress keys are built from level/week/type/spelling, so changing any
    // of them orphans what learners already memorised for this word.
    const movesKey =
      !!editing &&
      (editing.level !== values.level ||
        editing.week !== values.week ||
        editing.type !== type ||
        editing.en !== values.en.trim());

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        const en = values.en.trim();
        const meaning = values.meaning.trim();
        if (!en || !meaning) return setErr("Kata dan arti wajib diisi.");
        const low = en.toLowerCase();
        const inBundle = flatten(bundled.V).find(
          (x) => x.it[1].toLowerCase() === low,
        );
        if (inBundle)
          return setErr(`"${en}" sudah ada di minggu ${inBundle.w} level ini.`);
        const inShared = words.find(
          (w) =>
            w.id !== editing?.id &&
            w.level === values.level &&
            w.en.toLowerCase() === low,
        );
        if (inShared)
          return setErr(`"${en}" sudah ada di minggu ${inShared.week}.`);
        onSubmit({
          ...values,
          en,
          meaning,
          type,
          pron: values.pron.trim(),
          example: values.example.trim(),
        });
      },
      [values, bundled, words, editing, type, onSubmit],
    );

    return (
      <Card tone="ink" pad="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SectionLabel tone="green">{title}</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldLabel label="Kata / frasa (Inggris) *">
              <Input
                value={values.en}
                maxLength={120}
                placeholder="misal: run into"
                onChange={(e) => set({ en: e.target.value })}
              />
            </FieldLabel>
            <FieldLabel label="Arti *">
              <Input
                value={values.meaning}
                maxLength={300}
                placeholder="misal: tidak sengaja bertemu"
                onChange={(e) => set({ meaning: e.target.value })}
              />
            </FieldLabel>
            <FieldLabel label="Level">
              <Select
                value={values.level}
                onChange={(e) =>
                  set({ level: e.target.value as LevelId, week: 1 })
                }
              >
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </Select>
            </FieldLabel>
            <FieldLabel label="Minggu">
              <Select
                value={String(values.week)}
                onChange={(e) => set({ week: +e.target.value })}
              >
                {weeks.map(([n, t]) => (
                  <option key={n} value={String(n)}>
                    {String(n).padStart(2, "0") + (t ? " · " + t : "")}
                  </option>
                ))}
              </Select>
            </FieldLabel>
            <FieldLabel label="Lafal (opsional)">
              <Input
                value={values.pron}
                maxLength={120}
                placeholder="misal: ran IN-tu"
                onChange={(e) => set({ pron: e.target.value })}
              />
            </FieldLabel>
            <FieldLabel label="Contoh kalimat (opsional, sangat disarankan)">
              <Input
                value={values.example}
                maxLength={500}
                placeholder="misal: I ran into my old teacher at the mall."
                onChange={(e) => set({ example: e.target.value })}
              />
            </FieldLabel>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">
              Jenis · <span className="text-green">{TYPES[type]?.label}</span>
              {!values.type && " (tebakan otomatis, klik untuk ubah)"}
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.keys(TYPES).map((k) => (
                <Pill
                  key={k}
                  size="sm"
                  tone="green"
                  on={type === k}
                  onClick={() => set({ type: k })}
                >
                  {TYPES[k].label}
                </Pill>
              ))}
            </div>
          </div>

          {movesKey && (
            <span className="text-[13px] text-red">
              Mengubah kata, level, minggu, atau jenis membuat progres hafal
              pelajar untuk kata ini mulai dari nol.
            </span>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" variant="green" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan…" : submitLabel}
            </Button>
            <TextButton onClick={onCancel}>Batal</TextButton>
            {err && <span className="text-[13px] text-red">{err}</span>}
          </div>
        </form>
      </Card>
    );
  },
);

SharedWordForm.displayName = "SharedWordForm";

export default SharedWordForm;
