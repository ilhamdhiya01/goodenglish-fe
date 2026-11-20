"use client";

import Link from "next/link";
import React, { useState } from "react";

import Jalak from "@/components/brand/Jalak";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { FIELD_CLASS } from "@/components/ui/input/Input";
import SectionLabel from "@/components/ui/section-label";
import { RENCANA } from "@/const/rencana.config";
import type { HasilCheckpoint } from "@/lib/rencana/evaluasi";
import { laporAktivitas } from "@/lib/rencana/lapor";

export const hitungKata = (s: string) =>
  s.trim() ? s.trim().split(/\s+/).length : 0;

// Weekly checkpoint (Saturday–Monday): four parts with their status. Soft:
// passing marks the week and offers the next one; not passing only says
// what is missing — the learner may move on anyway.
const CheckpointCard = ({
  cp,
  minggu,
  adaBerikutnya,
  onPindah,
}: {
  cp: HasilCheckpoint;
  minggu: number;
  adaBerikutnya: boolean;
  onPindah: () => void;
}) => {
  const [teks, setTeks] = useState("");
  const kata = hitungKata(teks);
  const pas = kata >= RENCANA.ringkasanMin && kata <= RENCANA.ringkasanMax;

  return (
    <Card tone={cp.lulus ? "done" : "line"} className="gap-3">
      <SectionLabel tone={cp.lulus ? "ok" : "green"}>
        CHECKPOINT MINGGU INI · MINGGU {minggu}
      </SectionLabel>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {cp.syarat.map((s) => (
          <li key={s.id} className="flex items-start gap-2.5">
            <span
              aria-hidden
              className={`mt-0.5 w-5 shrink-0 text-center font-black ${s.ok ? "text-ok" : "text-ink-3"}`}
            >
              {s.ok ? "✓" : "–"}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-extrabold text-ink">
                {s.judul}
                {s.wajib ? " (wajib)" : ""}
                <span className="sr-only">
                  {s.ok ? ": terpenuhi" : ": belum"}
                </span>
              </span>
              <span className="text-[13px] leading-[18px] text-ink-2">
                {s.isi} · {s.ket}
              </span>
              {!s.ok && (
                <Link
                  href={s.tautan}
                  className="self-start text-[13px] font-extrabold text-accent-edge focus-ring hover:underline"
                >
                  Kerjakan →
                </Link>
              )}
            </span>
          </li>
        ))}
      </ul>

      {cp.perluRingkasan && (
        <div className="flex flex-col gap-2 border-t-2 border-line pt-3">
          <label
            htmlFor="ringkasan-tugas"
            className="text-sm font-extrabold text-ink"
          >
            Ringkasan tugas nyata ({RENCANA.ringkasanMin}–{RENCANA.ringkasanMax}{" "}
            kata, bahasa Inggris)
          </label>
          <textarea
            id="ringkasan-tugas"
            rows={5}
            value={teks}
            maxLength={1200}
            onChange={(e) => setTeks(e.target.value)}
            className={`${FIELD_CLASS} resize-y`}
          />
          <span
            className={`text-[13px] font-bold ${pas ? "text-ok" : "text-ink-2"}`}
            aria-live="polite"
          >
            {kata} kata
          </span>
          <Button
            className="self-start"
            disabled={!pas}
            onClick={() => {
              laporAktivitas("ringkasan_tugas", {
                jumlah: kata,
                data: { teks: teks.trim().slice(0, 1200) },
              });
              setTeks("");
            }}
          >
            Simpan ringkasan
          </Button>
        </div>
      )}

      {cp.lulus ? (
        <div className="flex flex-wrap items-center gap-3 border-t-2 border-line pt-3">
          <Jalak mood="bangga" size={48} />
          <span className="text-[15px] font-bold text-ink">
            Lulus. Kamu siap ke minggu berikutnya.
          </span>
          {adaBerikutnya && (
            <Button variant="green" onClick={onPindah}>
              Pindah ke minggu berikutnya
            </Button>
          )}
        </div>
      ) : (
        <span className="text-[13.5px] leading-[19px] font-bold text-ink-2">
          Belum lulus: {cp.kurang.join(", ")}. Boleh diulang besok, atau tetap
          lanjut.
        </span>
      )}
    </Card>
  );
};

export default CheckpointCard;
