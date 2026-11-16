"use client";

import classNames from "classnames";
import React, { useCallback, useMemo, useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Pill from "@/components/ui/pill";
import TypeBadge from "@/components/ui/type-badge";
import { LEVEL_OPTIONS } from "@/const/access.constant";
import { useWordMutations } from "@/lib/hooks/words/useWordMutations";
import { useWords } from "@/lib/hooks/words/useWords";
import type { LevelId } from "@/lib/types/session.types";
import type { SharedWordInput } from "@/lib/types/words.types";
import { confirmDialog } from "@/stores/useConfirmStore";

import SharedWordForm from "../SharedWordForm";
import TokenRowMenu from "../TokenRowMenu";

const HEADS = ["MINGGU", "KATA", "ARTI", "JENIS", "CONTOH", ""];

// From 700px a table; below it each word is a card of "label  value" lines
// (same markup, only the CSS changes — see TokenManager).
const TD =
  "md:border-b-2 md:border-line md:px-3 md:py-2.5 max-md:flex max-md:items-baseline max-md:gap-3";

const CellLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="w-[88px] shrink-0 text-[12.5px] leading-[18px] font-extrabold tracking-[0.07em] text-ink-3 uppercase md:hidden">
    {children}
  </span>
);

// Kosakata bersama: kata tambahan dari admin yang muncul untuk semua pelajar
// di level & minggunya, di samping kosakata bawaan app.
const WordManager = React.memo(() => {
  const { words, isError } = useWords(true);
  const { handleCreate, handleUpdate, handleDelete, isSaving } =
    useWordMutations();

  const [level, setLevel] = useState<LevelId>(LEVEL_OPTIONS[0].id);
  const [mode, setMode] = useState<"none" | "create" | string>("none");
  const editing = words?.find((w) => w.id === mode);

  const all = useMemo(() => words ?? [], [words]);
  const rows = useMemo(
    () =>
      all
        .filter((w) => w.level === level)
        .sort((a, b) => a.week - b.week || a.en.localeCompare(b.en)),
    [all, level],
  );

  const onCreate = useCallback(
    async (values: SharedWordInput) => {
      try {
        await handleCreate(values);
        setLevel(values.level);
        setMode("none");
      } catch {
        // Error toast is shown by useWordMutations.
      }
    },
    [handleCreate],
  );

  const onEdit = useCallback(
    async (values: SharedWordInput) => {
      if (!editing) return;
      try {
        await handleUpdate({ id: editing.id, values });
        setLevel(values.level);
        setMode("none");
      } catch {
        // Error toast is shown by useWordMutations.
      }
    },
    [editing, handleUpdate],
  );

  const remove = useCallback(
    async (id: string, en: string) => {
      if (
        !(await confirmDialog({
          title: `Hapus "${en}"?`,
          message: "Kata ini hilang dari Kosakata semua pelajar.",
          confirmLabel: "Hapus",
          tone: "danger",
        }))
      )
        return;
      handleDelete(id).catch(() => {});
      if (mode === id) setMode("none");
    },
    [handleDelete, mode],
  );

  return (
    <section className="flex flex-col gap-5">
      {mode === "create" ? (
        <SharedWordForm
          title="KATA BARU"
          submitLabel="Tambah kata"
          defaultLevel={level}
          words={all}
          isSubmitting={isSaving}
          onSubmit={(v) => void onCreate(v)}
          onCancel={() => setMode("none")}
        />
      ) : editing ? (
        <SharedWordForm
          key={editing.id}
          title={`UBAH · ${editing.en.toUpperCase()}`}
          submitLabel="Simpan"
          editing={editing}
          words={all}
          isSubmitting={isSaving}
          onSubmit={(v) => void onEdit(v)}
          onCancel={() => setMode("none")}
        />
      ) : (
        <Button
          variant="green"
          className="self-start"
          onClick={() => setMode("create")}
        >
          + Tambah kata
        </Button>
      )}

      <div className="flex flex-wrap gap-2">
        {LEVEL_OPTIONS.map((l) => (
          <Pill
            key={l.id}
            size="sm"
            on={level === l.id}
            onClick={() => setLevel(l.id)}
          >
            {l.label}
            <span className="font-bold tabular-nums">
              {all.filter((w) => w.level === l.id).length}
            </span>
          </Pill>
        ))}
      </div>

      <Card
        tone="line"
        pad="sm"
        className="max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none"
      >
        {!words && !isError ? (
          <span className="p-2 text-[13px] font-bold text-ink-2">Memuat…</span>
        ) : isError ? (
          <span className="p-2 text-sm font-bold text-bad">
            Gagal memuat kosakata bersama.
          </span>
        ) : !rows.length ? (
          <span className="p-2 text-sm font-semibold text-ink-2">
            Belum ada kata tambahan di level ini.
          </span>
        ) : (
          <table className="w-full border-collapse text-left text-sm max-md:block">
            <thead className="max-md:hidden">
              <tr>
                {HEADS.map((h) => (
                  <th
                    key={h}
                    className="border-b-2 border-line px-3 py-2.5 text-[12.5px] leading-[18px] font-extrabold tracking-[0.07em] text-ink-3 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="max-md:flex max-md:flex-col max-md:gap-3">
              {rows.map((w) => (
                <tr
                  key={w.id}
                  className="align-top max-md:relative max-md:flex max-md:flex-col max-md:gap-2 max-md:rounded-xl max-md:border-2 max-md:border-line max-md:bg-surface max-md:p-4 max-md:edge-card md:h-11"
                >
                  <td className={classNames(TD, "tabular-nums max-md:pr-12")}>
                    <CellLabel>{HEADS[0]}</CellLabel>
                    <span className="font-extrabold text-ink-2">
                      {String(w.week).padStart(2, "0")}
                    </span>
                  </td>
                  <td className={TD}>
                    <CellLabel>{HEADS[1]}</CellLabel>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-extrabold text-ink">{w.en}</span>
                      {w.pron && (
                        <span className="text-[12.5px] font-semibold text-ink-2">
                          {w.pron}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={classNames(TD, "text-ink")}>
                    <CellLabel>{HEADS[2]}</CellLabel>
                    <span>{w.meaning}</span>
                  </td>
                  <td className={TD}>
                    <CellLabel>{HEADS[3]}</CellLabel>
                    <TypeBadge type={w.type} />
                  </td>
                  <td className={classNames(TD, "text-ink-2 md:max-w-[280px]")}>
                    <CellLabel>{HEADS[4]}</CellLabel>
                    <span className="italic">{w.example || "—"}</span>
                  </td>
                  <td className="max-md:absolute max-md:top-3 max-md:right-3 md:border-b-2 md:border-line md:px-3 md:py-1">
                    <div className="flex justify-end">
                      <TokenRowMenu
                        groups={[
                          [{ label: "Ubah", onSelect: () => setMode(w.id) }],
                          [
                            {
                              label: "Hapus",
                              tone: "red",
                              onSelect: () => remove(w.id, w.en),
                            },
                          ],
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </section>
  );
});

WordManager.displayName = "WordManager";

export default WordManager;
