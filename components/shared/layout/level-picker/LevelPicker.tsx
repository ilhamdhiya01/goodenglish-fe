"use client";

import classNames from "classnames";
import React, { useMemo, useState } from "react";
import { LuChevronDown } from "react-icons/lu";

import Menu from "@/components/ui/menu";
import ProgressBar from "@/components/ui/progress-bar";
import Sheet from "@/components/ui/sheet";
import { levelName, LEVELS } from "@/const/levels.constant";
import { flatten, levelData } from "@/lib/helpers/level-data.helper";
import { itemKey } from "@/lib/helpers/storage.helper";
import { useAccessStore } from "@/stores/useAccessStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { useQuizStore } from "@/stores/useQuizStore";
import { useExtraWords } from "@/stores/useSharedWordsStore";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

interface LevelStat {
  id: string;
  name: string;
  desc: string;
  tot: number;
  kn: number;
}

// Known / total per level the token may open (levels it may not are hidden).
const useLevelStats = () => {
  const known = useProgressStore((s) => s.known);
  const custom = useExtraWords();
  const allowed = useAccessStore((s) => s.session?.levels);
  return useMemo<LevelStat[]>(
    () =>
      LEVELS.filter(([id]) => allowed?.includes(id as never)).map(
        ([id, name, desc]) => {
          const all = flatten(levelData(id, custom).V);
          const kn = all.filter(
            (x) => known[itemKey(id, x.w, x.it[0], x.it[1])],
          ).length;
          return { id, name, desc, tot: all.length, kn };
        },
      ),
    [known, custom, allowed],
  );
};

const pick = (id: string) => {
  useLevelStore.getState().setLevel(id);
  // Filter pencarian Kosakata dan sesi tes ikut direset (dipanggil lewat
  // getState agar komponen ini tidak subscribe ke seluruh store UI).
  useVocabUiStore.getState().resetBrowse();
  useQuizStore.getState().close();
};

const LevelBody = ({ s }: { s: LevelStat }) => (
  <span className="flex w-full flex-col gap-1.5">
    <span className="flex items-baseline justify-between gap-3">
      <span>{s.name}</span>
      <span className="text-xs font-bold text-ink-2 tabular-nums">
        {s.tot ? `${s.kn}/${s.tot}` : "segera"}
      </span>
    </span>
    <span className="text-[12.5px] leading-[18px] font-semibold text-ink-2">
      {s.desc}
    </span>
    {s.tot > 0 && (
      <ProgressBar
        pct={(s.kn / s.tot) * 100}
        name={`${s.name}: ${s.kn} dari ${s.tot} hafal`}
        className="[&>[role=progressbar]]:h-1.5"
      />
    )}
  </span>
);

interface LevelPickerProps {
  /** sidebar: bottom of the sidebar, opens upward · bar: top row (tablet)
   * · phone: top bar, opens a sheet. */
  variant?: "sidebar" | "bar" | "phone";
  className?: string;
}

// Pemilih level: one button ("Pemula · Minggu 3 ▾") that opens the four
// levels with their description and known / total, as before.
const LevelPicker = React.memo(
  ({ variant = "sidebar", className }: LevelPickerProps) => {
    const level = useLevelStore((s) => s.level);
    const week = useLevelStore((s) => s.week);
    const stats = useLevelStats();
    const [sheet, setSheet] = useState(false);

    const label =
      variant === "phone"
        ? `${levelName(level)} · M${week}`
        : `${levelName(level)} · Minggu ${week}`;
    const triggerCls = classNames(
      "inline-flex min-h-11 min-w-0 press cursor-pointer items-center justify-between gap-2 rounded-lg border-2 border-control bg-surface px-3.5 text-sm font-extrabold text-ink edge focus-ring [--edge:var(--color-control)] hover:bg-sunken",
      variant === "sidebar" && "w-full",
    );
    const body = (
      <>
        {variant === "sidebar" ? (
          // Two lines: long level names don't fit the 250px sidebar.
          <span className="flex min-w-0 flex-col py-1.5 text-left leading-5">
            <span>{levelName(level)}</span>
            <span className="text-[12.5px] font-bold text-ink-2">
              Minggu {week}
              <span className="sr-only">, pilih level</span>
            </span>
          </span>
        ) : (
          <span className="truncate">
            {label}
            <span className="sr-only">, pilih level</span>
          </span>
        )}
        <LuChevronDown aria-hidden size={16} className="shrink-0" />
      </>
    );

    if (variant === "phone") {
      return (
        <>
          <button
            type="button"
            title="Pilih level"
            aria-haspopup="dialog"
            onClick={() => setSheet(true)}
            className={classNames(triggerCls, className)}
          >
            {body}
          </button>
          {sheet && (
            <Sheet label="Pilih level" onClose={() => setSheet(false)}>
              {stats.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  aria-current={s.id === level ? "true" : undefined}
                  onClick={() => {
                    pick(s.id);
                    setSheet(false);
                  }}
                  className={classNames(
                    "flex cursor-pointer rounded-lg border-2 px-3.5 py-3 text-left text-[15px] font-extrabold focus-ring",
                    s.id === level
                      ? "border-accent-line bg-accent-tint text-accent-edge"
                      : "border-line text-ink hover:bg-sunken",
                  )}
                >
                  <LevelBody s={s} />
                </button>
              ))}
            </Sheet>
          )}
        </>
      );
    }

    return (
      <Menu
        label="Pilih level"
        side={variant === "sidebar" ? "top" : "bottom"}
        align={variant === "sidebar" ? "start" : "end"}
        className={classNames(variant === "sidebar" && "w-full", className)}
        button={(p) => (
          <button
            type="button"
            title="Pilih level"
            className={triggerCls}
            {...p}
          >
            {body}
          </button>
        )}
      >
        <div className="flex w-[320px] max-w-[80vw] flex-col gap-1">
          {stats.map((s) => (
            <Menu.Item
              key={s.id}
              selected={s.id === level}
              onSelect={() => pick(s.id)}
            >
              <LevelBody s={s} />
            </Menu.Item>
          ))}
        </div>
      </Menu>
    );
  },
);

LevelPicker.displayName = "LevelPicker";

export default LevelPicker;
