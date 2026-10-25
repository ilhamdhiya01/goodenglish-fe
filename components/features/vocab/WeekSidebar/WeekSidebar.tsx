"use client";

import classNames from "classnames";
import React from "react";

import { levelName } from "@/const/levels.constant";
import type { LevelData } from "@/lib/helpers/level-data.helper";
import { itemKey } from "@/lib/helpers/storage.helper";
import { useLevelStore } from "@/stores/useLevelStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

// Sidebar "Rencana belajar": daftar minggu + progres hafal per minggu.
const WeekSidebar = React.memo(({ data }: { data: LevelData }) => {
  const level = useLevelStore((s) => s.level);
  const week = useLevelStore((s) => s.week);
  const setWeek = useLevelStore((s) => s.setWeek);
  const known = useProgressStore((s) => s.known);
  const resetBrowse = useVocabUiStore((s) => s.resetBrowse);
  const { plan, V } = data;

  return (
    <aside className="flex min-w-0 flex-[1_1_260px] flex-col gap-1 min-[900px]:sticky min-[900px]:top-4 min-[900px]:max-w-[300px]">
      <span className="px-2.5 pb-1.5 font-mono text-[11px] tracking-[0.08em] text-muted">
        RENCANA BELAJAR · {levelName(level).toUpperCase()}
      </span>
      {plan.map(([n, title, tense]) => {
        const wd = V[String(n)];
        const ready = !!wd;
        const active = week === n;
        const kn = ready
          ? wd.items.filter((it) => known[itemKey(level, n, it[0], it[1])])
              .length
          : 0;
        const tot = ready ? wd.items.length : 0;
        return (
          <button
            type="button"
            key={n}
            onClick={() => {
              setWeek(n);
              resetBrowse();
            }}
            className={classNames(
              "flex cursor-pointer flex-col gap-[5px] rounded-lg border-[1.5px] px-3 py-2.5 text-left font-sans transition-colors",
              active
                ? "border-ink bg-ink"
                : "border-transparent bg-transparent hover:border-ink",
              ready ? "opacity-100" : "opacity-55",
            )}
          >
            <div className="flex items-baseline gap-2.5">
              <span
                className={classNames(
                  "shrink-0 font-mono text-xs",
                  active ? "text-mint" : "text-green",
                )}
              >
                {String(n).padStart(2, "0")}
              </span>
              <span
                className={classNames(
                  "text-sm leading-[1.25] font-semibold",
                  active ? "text-paper" : "text-ink",
                )}
              >
                {title}
              </span>
            </div>
            <div className="flex items-center gap-2.5 pl-7">
              <span
                className={classNames(
                  "flex-1 text-xs",
                  active ? "text-ondark" : "text-muted",
                )}
              >
                {tense}
              </span>
              <span
                className={classNames(
                  "font-mono text-[11px]",
                  active ? "text-ondark" : "text-muted",
                )}
              >
                {ready ? kn + "/" + tot : "segera"}
              </span>
            </div>
            {ready && (
              <div
                className={classNames(
                  "ml-7 h-[3px] overflow-hidden rounded-sm",
                  active ? "bg-ink-2" : "bg-track",
                )}
              >
                <div
                  className={classNames(
                    "h-full",
                    active ? "bg-mint" : "bg-green",
                  )}
                  style={{
                    width: tot ? Math.round((kn / tot) * 100) + "%" : "0%",
                  }}
                />
              </div>
            )}
          </button>
        );
      })}
    </aside>
  );
});

WeekSidebar.displayName = "WeekSidebar";

export default WeekSidebar;
