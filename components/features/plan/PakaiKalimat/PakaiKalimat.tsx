"use client";

import React, { useMemo, useState } from "react";

import Correction from "@/components/shared/patterns/correction";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { FIELD_CLASS } from "@/components/ui/input/Input";
import SectionLabel from "@/components/ui/section-label";
import { accessErrorText } from "@/const/access.constant";
import { RENCANA } from "@/const/rencana.config";
import { laporAktivitas } from "@/lib/rencana/lapor";
import type { DataJenis } from "@/lib/rencana/rencana.contract";
import type { LevelId } from "@/lib/types/session.types";
import type { SentenceCheck } from "@/services/ai.service";
import { checkSentences } from "@/services/rencana.service";
import { useLaporanStore } from "@/stores/useLaporanStore";

// Kept under the server's 2000-character limit for `data`.
const potong = (t: string | undefined, max: number) => (t ?? "").slice(0, max);

// Langkah "Pakai": three sentences of the learner's own, checked by the AI
// in one call (one Tanya AI question). Every checked sentence is reported;
// the step counts them, right or wrong — using the language is the point.
// The sentence and its correction travel in the report, so today's results
// come back after a reload (and on another device).
const PakaiKalimat = ({
  level,
  sudah,
  T,
}: {
  level: LevelId;
  /** Sentences already checked today. */
  sudah: number;
  /** Today (study day). */
  T: number;
}) => {
  const n = RENCANA.kalimatHarian;
  const [teks, setTeks] = useState<string[]>(() => Array(n).fill(""));
  const items = useLaporanStore((s) => s.items);
  const hasil = useMemo(
    () =>
      items.flatMap((l) => {
        if (l.jenis !== "kalimat_dicek" || l.day !== T) return [];
        const d = l.data as Partial<DataJenis["kalimat_dicek"]> | null;
        return d?.sumber === "rencana" && d.kalimat ? [{ id: l.id, ...d }] : [];
      }),
    [items, T],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isi = teks.map((t) => t.trim()).filter(Boolean);

  const cek = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await checkSentences({ sentences: isi, level });
      r.data.checks.forEach((c: SentenceCheck) =>
        laporAktivitas("kalimat_dicek", {
          data: {
            benar: c.isCorrect,
            sumber: "rencana",
            kalimat: potong(c.original, 300),
            ...(c.isCorrect
              ? {}
              : {
                  koreksi: potong(c.corrected, 300),
                  alasan: potong(c.explanationId, 1000),
                }),
          },
        }),
      );
      setTeks(Array(n).fill(""));
    } catch (e) {
      setError(accessErrorText((e as Error).message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card id="pakai" className="scroll-mt-24 gap-3">
      <SectionLabel tone="green">
        PAKAI · {Math.min(sudah, n)}/{n} KALIMAT HARI INI
      </SectionLabel>
      <span className="text-[13.5px] leading-[19px] text-ink-2">
        Tulis kalimatmu sendiri dalam bahasa Inggris, bebas tentang apa saja
        (pakai kata minggu ini kalau bisa). Ketiganya dicek sekaligus.
      </span>
      {teks.map((t, i) => (
        <textarea
          key={i}
          aria-label={`Kalimat ${i + 1}`}
          rows={2}
          maxLength={300}
          value={t}
          placeholder={`Kalimat ${i + 1}`}
          onChange={(e) =>
            setTeks((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))
          }
          className={`${FIELD_CLASS} min-h-12 resize-y`}
        />
      ))}
      <Button
        variant="green"
        className="self-start"
        disabled={busy || isi.length === 0}
        onClick={() => void cek()}
      >
        {busy ? "Mengecek…" : "Cek dengan AI"}
      </Button>
      {error && (
        <span role="alert" className="text-sm font-bold text-bad">
          {error}
        </span>
      )}
      {hasil.length > 0 && (
        <div className="flex flex-col gap-2" role="status">
          <SectionLabel>SUDAH DICEK HARI INI</SectionLabel>
          {hasil.map((c) =>
            c.benar ? (
              <Correction key={c.id} right={c.kalimat} why="Sudah benar." />
            ) : (
              <Correction
                key={c.id}
                wrong={c.kalimat}
                right={c.koreksi ?? ""}
                speak={c.koreksi}
                why={c.alasan ?? ""}
              />
            ),
          )}
        </div>
      )}
    </Card>
  );
};

export default PakaiKalimat;
