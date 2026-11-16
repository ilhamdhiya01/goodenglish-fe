"use client";

import React from "react";

import ListItem from "@/components/shared/patterns/list-item";
import SectionLabel from "@/components/ui/section-label";
import { levelName } from "@/const/levels.constant";
import type { LevelData } from "@/lib/helpers/level-data.helper";
import { itemKey } from "@/lib/helpers/storage.helper";
import { useLevelStore } from "@/stores/useLevelStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

interface Props {
  data: LevelData;
  /** Called after a week is picked (the phone sheet closes). */
  onPicked?: () => void;
  /** Hide the "Rencana belajar" label (the sheet has its own title). */
  bare?: boolean;
}

// "Rencana belajar": the weeks of this level with known / total per week.
// The open week is the active row; weeks without material yet are muted.
const WeekSidebar = React.memo(({ data, onPicked, bare }: Props) => {
  const level = useLevelStore((s) => s.level);
  const week = useLevelStore((s) => s.week);
  const setWeek = useLevelStore((s) => s.setWeek);
  const known = useProgressStore((s) => s.known);
  const resetBrowse = useVocabUiStore((s) => s.resetBrowse);
  const { plan, V } = data;

  return (
    <nav aria-label="Daftar minggu" className="flex flex-col gap-1">
      {!bare && (
        <SectionLabel className="px-1 pb-1.5">
          Rencana belajar · {levelName(level)}
        </SectionLabel>
      )}
      {plan.map(([n, title, tense]) => {
        const wd = V[String(n)];
        const ready = !!wd;
        const kn = ready
          ? wd.items.filter((it) => known[itemKey(level, n, it[0], it[1])])
              .length
          : 0;
        const tot = ready ? wd.items.length : 0;
        return (
          <ListItem
            key={n}
            active={week === n}
            muted={!ready}
            trailing={!ready ? "segera" : kn === tot ? "✓" : `${kn}/${tot}`}
            onClick={() => {
              setWeek(n);
              resetBrowse();
              onPicked?.();
            }}
          >
            <span className="flex flex-col">
              <span>
                {n} · {title}
              </span>
              <span className="text-xs leading-4 font-semibold">{tense}</span>
            </span>
          </ListItem>
        );
      })}
    </nav>
  );
});

WeekSidebar.displayName = "WeekSidebar";

export default WeekSidebar;
