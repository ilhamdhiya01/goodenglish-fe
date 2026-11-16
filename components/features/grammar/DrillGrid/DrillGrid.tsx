"use client";

import classNames from "classnames";
import React, { useState } from "react";

import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import TextButton from "@/components/ui/text-button";
import { idOf } from "@/lib/content";

interface Props {
  /** [soal (Indo), jawaban (Inggris), alasan?] */
  rows: [string, string, string?][];
  /** Tampilkan terjemahan otomatis (idOf) di bawah soal & jawaban. */
  showIds?: boolean;
  /** Label bagian di atas grid + tombol "Tutup semua". Kosongkan untuk tanpa header. */
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
          <SectionLabel>{label}</SectionLabel>
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
                "flex press cursor-pointer flex-col gap-1.5 rounded-lg border-2 px-3.5 py-3 text-left edge focus-ring",
                o
                  ? "border-accent-line bg-accent-wash [--edge:var(--color-accent-line)]"
                  : "border-control bg-surface [--edge:var(--color-control)] hover:bg-sunken",
              )}
            >
              <span className="text-[15px] leading-[22px] font-semibold text-ink">
                <span className="mr-1.5 text-[13px] font-extrabold text-ink-3 tabular-nums">
                  {i + 1}.
                </span>
                {q}
              </span>
              {showIds && !!idOf(q.split(" → ")[0]) && (
                <span className="text-[13px] text-ink-2">
                  {idOf(q.split(" → ")[0])}
                </span>
              )}
              {o ? (
                <span className="flex flex-col gap-1 border-t-2 border-dashed border-accent-line pt-2">
                  <span className="flex items-center gap-2">
                    <span className="text-base leading-[22px] font-bold text-ink">
                      {a}
                    </span>
                    <SpeakButton nested size={28} icon={13} text={a} />
                  </span>
                  {showIds && !!idOf(a) && (
                    <span className="-mt-0.5 text-[13px] text-ink-2">
                      {idOf(a)}
                    </span>
                  )}
                  {!!why && (
                    <span className="text-[13px] leading-[19px] font-semibold text-ink-2">
                      {why}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-[13px] font-bold text-accent-edge">
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
