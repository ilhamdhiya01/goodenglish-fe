"use client";

import classNames from "classnames";
import React, { useState } from "react";

import SpeakButton from "@/components/ui/speak-button";
import TextButton from "@/components/ui/text-button";
import { idOf } from "@/lib/content";

interface Props {
  /** [soal (Indo), jawaban (Inggris), alasan?] */
  rows: [string, string, string?][];
  /** Tampilkan terjemahan otomatis (idOf) di bawah soal & jawaban. */
  showIds?: boolean;
  /** Label mono di atas grid + tombol "Tutup semua". Kosongkan untuk tanpa header. */
  label?: string;
}

// Grid latihan "ubah/terjemahkan, ucapkan, lalu klik untuk buka" —
// dipakai di GrammarDetail, kata bantu, kata sambung, dan rumus Bertanya.
const DrillGrid = React.memo(({ rows, showIds = false, label }: Props) => {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  return (
    <div className="flex flex-col gap-2.5">
      {!!label && (
        <div className="flex flex-wrap items-baseline justify-between gap-2.5">
          <span className="font-mono text-xs tracking-[0.06em] text-muted">
            {label}
          </span>
          <TextButton onClick={() => setOpen({})}>Tutup semua</TextButton>
        </div>
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-2">
        {rows.map(([q, a, why], i) => {
          const o = !!open[i];
          return (
            <button
              type="button"
              key={i}
              onClick={() => setOpen((s) => ({ ...s, [i]: !s[i] }))}
              className={classNames(
                "flex cursor-pointer flex-col gap-[5px] rounded-lg border-[1.5px] px-[13px] py-[11px] text-left font-sans transition-colors hover:border-ink",
                o ? "border-green bg-green-bg" : "border-line bg-card",
              )}
            >
              <span className="text-[14.5px] text-ink">
                <span className="mr-1.5 font-mono text-[11px] text-faint">
                  {i + 1}.
                </span>
                {q}
              </span>
              {showIds && !!idOf(q.split(" → ")[0]) && (
                <span className="text-[12.5px] text-faint">
                  {idOf(q.split(" → ")[0])}
                </span>
              )}
              {o ? (
                <span className="flex flex-col gap-[5px]">
                  <span className="flex items-center gap-2">
                    <span className="font-serif text-[17px] text-green italic">
                      {a}
                    </span>
                    <SpeakButton size={22} icon={11} text={a} />
                  </span>
                  {showIds && !!idOf(a) && (
                    <span className="-mt-[3px] text-[12.5px] text-faint">
                      {idOf(a)}
                    </span>
                  )}
                  {!!why && (
                    <span className="font-mono text-[11.5px] text-muted">
                      {why}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-[12.5px] text-faint">
                  klik untuk lihat jawaban
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

DrillGrid.displayName = "DrillGrid";

export default DrillGrid;
