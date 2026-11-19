"use client";

import React, { useState } from "react";

import Correction from "@/components/shared/patterns/correction";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { FIELD_CLASS } from "@/components/ui/input/Input";
import SectionLabel from "@/components/ui/section-label";
import { accessErrorText } from "@/const/access.constant";
import { RENCANA } from "@/const/rencana.config";
import { laporAktivitas } from "@/lib/rencana/lapor";
import type { LevelId } from "@/lib/types/session.types";
import type { SentenceCheck } from "@/services/ai.service";
import { checkSentences } from "@/services/rencana.service";

// Langkah "Pakai": three sentences of the learner's own, checked by the AI
// in one call (one Tanya AI question). Every checked sentence is reported;
// the step counts them, right or wrong — using the language is the point.
const PakaiKalimat = ({
  level,
  sudah,
}: {
  level: LevelId;
  /** Sentences already checked today. */
  sudah: number;
}) => {
  const n = RENCANA.kalimatHarian;
  const [teks, setTeks] = useState<string[]>(() => Array(n).fill(""));
  const [hasil, setHasil] = useState<SentenceCheck[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isi = teks.map((t) => t.trim()).filter(Boolean);

  const cek = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await checkSentences({ sentences: isi, level });
      setHasil(r.data.checks);
      r.data.checks.forEach((c) =>
        laporAktivitas("kalimat_dicek", {
          data: { benar: c.isCorrect, sumber: "rencana" },
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
      {hasil && (
        <div className="flex flex-col gap-2" role="status">
          {hasil.map((c, i) =>
            c.isCorrect ? (
              <Correction key={i} right={c.original} why="Sudah benar." />
            ) : (
              <Correction
                key={i}
                wrong={c.original}
                right={c.corrected}
                speak={c.corrected}
                why={c.explanationId}
              />
            ),
          )}
        </div>
      )}
    </Card>
  );
};

export default PakaiKalimat;
