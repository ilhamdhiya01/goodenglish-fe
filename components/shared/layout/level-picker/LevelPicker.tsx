"use client";

import classNames from "classnames";
import React, { useMemo } from "react";

import { LEVELS } from "@/const/levels.constant";
import { flatten, levelData } from "@/lib/helpers/level-data.helper";
import { itemKey } from "@/lib/helpers/storage.helper";
import { useAccessStore } from "@/stores/useAccessStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { useQuizStore } from "@/stores/useQuizStore";
import { useExtraWords } from "@/stores/useSharedWordsStore";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

// Pemilih level — 4 kartu dengan progres hafal per level.
const LevelPicker = React.memo(() => {
  const level = useLevelStore((s) => s.level);
  const setLevel = useLevelStore((s) => s.setLevel);
  const known = useProgressStore((s) => s.known);
  const custom = useExtraWords();
  // Only the levels this access token may open.
  const allowed = useAccessStore((s) => s.session?.levels);

  const stats = useMemo(
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

  return (
    <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2.5">
      {stats.map(({ id, name, desc, tot, kn }) => {
        const active = id === level;
        return (
          <button
            type="button"
            key={id}
            onClick={() => {
              setLevel(id);
              // Filter pencarian Kosakata dan sesi tes ikut direset (dipanggil lewat
              // getState agar komponen ini tidak subscribe ke seluruh store UI).
              useVocabUiStore.getState().resetBrowse();
              useQuizStore.getState().close();
            }}
            className={classNames(
              "flex cursor-pointer flex-col gap-2 rounded-[10px] border-[1.5px] px-4 py-3.5 text-left font-sans transition-colors hover:border-ink",
              active
                ? "border-ink bg-ink text-paper"
                : "border-line bg-card text-ink",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 flex-1 text-[15px] leading-[1.25] font-bold">
                {name}
              </span>
              <span
                className={classNames(
                  "font-mono text-[11px]",
                  active ? "text-ondark" : "text-muted",
                )}
              >
                {tot ? kn + "/" + tot : "segera"}
              </span>
            </div>
            <span
              className={classNames(
                "text-[12.5px] leading-[1.4]",
                active ? "text-ondark" : "text-muted",
              )}
            >
              {desc}
            </span>
            <div
              className={classNames(
                "h-1 overflow-hidden rounded-sm",
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
          </button>
        );
      })}
    </section>
  );
});

LevelPicker.displayName = "LevelPicker";

export default LevelPicker;
