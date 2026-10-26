"use client";

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

import SharedWordForm from "../SharedWordForm";
import TokenRowMenu from "../TokenRowMenu";

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
    (id: string, en: string) => {
      if (
        !window.confirm(
          `Hapus "${en}"? Kata ini hilang dari Kosakata semua pelajar.`,
        )
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
            <span className="ml-1.5 font-mono text-[11px] opacity-70">
              {all.filter((w) => w.level === l.id).length}
            </span>
          </Pill>
        ))}
      </div>

      <Card tone="line" pad="sm" className="overflow-x-auto">
        {!words && !isError ? (
          <span className="p-2 font-mono text-xs text-muted">Memuat…</span>
        ) : isError ? (
          <span className="p-2 text-sm text-red">
            Gagal memuat kosakata bersama.
          </span>
        ) : !rows.length ? (
          <span className="p-2 text-sm text-muted">
            Belum ada kata tambahan di level ini.
          </span>
        ) : (
          <table className="w-full min-w-[760px] border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="font-mono text-[11px] tracking-[0.06em] text-muted">
                {["MINGGU", "KATA", "ARTI", "JENIS", "CONTOH", ""].map((h) => (
                  <th
                    key={h}
                    className="border-b-[1.5px] border-line px-2.5 py-2 font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} className="align-top">
                  <td className="border-b border-hairline px-2.5 py-2.5 font-mono tabular-nums">
                    {String(w.week).padStart(2, "0")}
                  </td>
                  <td className="border-b border-hairline px-2.5 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">{w.en}</span>
                      {w.pron && (
                        <span className="font-mono text-[11.5px] text-faint">
                          {w.pron}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border-b border-hairline px-2.5 py-2.5 text-ink-3">
                    {w.meaning}
                  </td>
                  <td className="border-b border-hairline px-2.5 py-2.5">
                    <TypeBadge type={w.type} />
                  </td>
                  <td className="max-w-[280px] border-b border-hairline px-2.5 py-2.5 font-serif text-ink-2 italic">
                    {w.example || "—"}
                  </td>
                  <td className="border-b border-hairline px-2.5 py-2.5">
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
