"use client";

import React from "react";

import Button from "@/components/ui/button";
import FieldLabel from "@/components/ui/field-label";
import Input from "@/components/ui/input";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import Select from "@/components/ui/select";
import TextButton from "@/components/ui/text-button";
import { TYPES } from "@/const/vocab-types.constant";
import type { LevelData } from "@/lib/helpers/level-data.helper";
import { guessType } from "@/lib/helpers/level-data.helper";
import { itemKey } from "@/lib/helpers/storage.helper";
import type { CustomWord, FormState, PlanRow } from "@/lib/types/vocab.types";
import { useLevelStore } from "@/stores/useLevelStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

// Form "Kataku": ubah kata sendiri yang sudah ada. Kata baru untuk semua
// pelajar ditambah admin lewat dashboard (Admin › Kosakata).
// Validasi: kata & arti wajib; kata tidak boleh duplikat di level ini.
const WordForm = React.memo(
  ({ plan, data }: { plan: PlanRow[]; data: LevelData }) => {
    const level = useLevelStore((s) => s.level);
    const week = useLevelStore((s) => s.week);
    const setWeek = useLevelStore((s) => s.setWeek);
    const custom = useProgressStore((s) => s.custom);
    const setCustom = useProgressStore((s) => s.setCustom);
    const renameProgressKey = useProgressStore((s) => s.renameProgressKey);

    const form = useVocabUiStore((s) => s.form) as FormState;
    const formErr = useVocabUiStore((s) => s.formErr);
    const ui = useVocabUiStore.getState;

    const setF = (patch: Partial<FormState>, clearErr = false) => {
      ui().setForm({ ...form, ...patch });
      if (clearErr) ui().setFormErr("");
    };

    const submit = () => {
      const en = (form.en || "").trim();
      const id = (form.id || "").trim();
      if (!en || !id) {
        ui().setFormErr("Kata dan arti wajib diisi.");
        return;
      }
      const dupe: string[] = [];
      Object.keys(data.V).forEach((w) =>
        data.V[w].items.forEach((it) => {
          if (
            it[1].toLowerCase() === en.toLowerCase() &&
            (!form.editKey || it[6] !== form.editKey)
          )
            dupe.push(w);
        }),
      );
      if (dupe.length) {
        ui().setFormErr(
          '"' + en + '" sudah ada di minggu ' + dupe.join(", ") + ".",
        );
        return;
      }
      const wk = +form.week || week;
      const ty = form.type || guessType(en);
      if (form.editKey) {
        const old = custom.find((c) => c.key === form.editKey);
        setCustom((cs) =>
          cs.map((c) =>
            c.key === form.editKey
              ? {
                  ...c,
                  en,
                  id,
                  pron: (form.pron || "").trim(),
                  ex: (form.ex || "").trim(),
                  type: ty,
                  week: wk,
                }
              : c,
          ),
        );
        // kalau kata/minggu berubah, progres hafal/SRS/kalimatku ikut pindah kunci
        if (old && (old.en !== en || old.week !== wk || old.type !== ty))
          renameProgressKey(
            itemKey(level, old.week, old.type, old.en),
            itemKey(level, wk, ty, en),
          );
      } else {
        setCustom((cs) => [
          ...cs,
          {
            key: "c" + Date.now().toString(36),
            level,
            week: wk,
            type: ty,
            en,
            id,
            pron: (form.pron || "").trim(),
            ex: (form.ex || "").trim(),
          } satisfies CustomWord,
        ]);
      }
      ui().closeForm();
      setWeek(wk);
    };

    const fGuess = form.type || (form.en ? guessType(form.en) : "w");

    return (
      <div className="flex flex-col gap-3 rounded-xl border-2 border-accent-line bg-accent-wash px-4.5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2.5">
          <SectionLabel tone="green">
            KATAKU ·{" "}
            {form.editKey
              ? "Ubah kata"
              : "Tambah kata ke minggu " + (form.week || week)}
          </SectionLabel>
          <TextButton onClick={() => ui().closeForm()}>Batal</TextButton>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2.5">
          <FieldLabel label="Kata / frasa (Inggris) *">
            <Input
              value={form.en}
              onChange={(e) => setF({ en: e.target.value }, true)}
              placeholder="misal: run into"
            />
          </FieldLabel>
          <FieldLabel label="Arti *">
            <Input
              value={form.id}
              onChange={(e) => setF({ id: e.target.value }, true)}
              placeholder="misal: tidak sengaja bertemu"
            />
          </FieldLabel>
          <FieldLabel label="Lafal (opsional)">
            <Input
              value={form.pron}
              onChange={(e) => setF({ pron: e.target.value })}
              placeholder="misal: ran IN-tu"
            />
          </FieldLabel>
          <FieldLabel label="Minggu">
            <Select
              value={String(form.week || week)}
              onChange={(e) => setF({ week: +e.target.value })}
            >
              {plan.map(([n, title]) => (
                <option key={n} value={String(n)}>
                  {String(n).padStart(2, "0") + " · " + title}
                </option>
              ))}
            </Select>
          </FieldLabel>
        </div>
        <FieldLabel label="Contoh kalimat (opsional, sangat disarankan)">
          <Input
            value={form.ex}
            onChange={(e) => setF({ ex: e.target.value })}
            placeholder="misal: I ran into my old teacher at the mall."
          />
        </FieldLabel>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-extrabold text-ink-2">
            Jenis ·{" "}
            <span className="text-accent-edge">
              {TYPES[fGuess] ? TYPES[fGuess].label : "Kata dasar"}
            </span>
            {!form.type && " (tebakan otomatis, klik untuk ubah)"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(TYPES).map((k) => {
              const on = fGuess === k;
              return (
                <Pill
                  key={k}
                  size="sm"
                  on={on}
                  onClick={() => setF({ type: k })}
                >
                  {TYPES[k].label}
                </Pill>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="green" onClick={submit}>
            Simpan
          </Button>
          {formErr && (
            <span className="text-[13px] font-bold text-bad">{formErr}</span>
          )}
          <span className="text-[12.5px] text-ink-2">
            Tersimpan di akunmu; ikut Ekspor progres.
          </span>
        </div>
      </div>
    );
  },
);

WordForm.displayName = "WordForm";

export default WordForm;
