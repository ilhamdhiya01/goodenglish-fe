"use client";

import classNames from "classnames";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { LuSearch } from "react-icons/lu";

import TargetMark from "@/components/shared/patterns/target-mark";
import Pill from "@/components/ui/pill";
import TypeBadge from "@/components/ui/type-badge";
import { LEVELS } from "@/const/levels.constant";
import type { Flat } from "@/lib/helpers/level-data.helper";
import { flatten } from "@/lib/helpers/level-data.helper";
import {
  itemKey,
  loadStr,
  saveStr,
  STORAGE_KEYS,
} from "@/lib/helpers/storage.helper";
import type { VerbForms } from "@/lib/helpers/verb-forms.helper";
import {
  buildSearchIndex,
  groupHits,
  searchVocab,
} from "@/lib/helpers/verb-forms.helper";
import { useJumpToWord } from "@/lib/hooks/useJumpToWord";
import { useShellData } from "@/lib/hooks/useShellData";
import { useAccessStore } from "@/stores/useAccessStore";

interface GlobalSearchProps {
  /** bar: field in the top row with a dropdown · screen: the phone's
   * full-screen search (results listed under the field). */
  variant?: "bar" | "screen";
  /** Called after a result is picked (the phone screen closes itself). */
  onPicked?: () => void;
  autoFocus?: boolean;
  /** Screen variant: shown left of the field (the back button). */
  before?: React.ReactNode;
}

// Pencarian global: ketik → hasil dari semua level (atau level ini) → klik →
// pindah ke level & minggu kata itu. Berbeda dari kotak cari di Kosakata yang
// hanya menyaring minggu yang dibuka.
const GlobalSearch = React.memo(
  ({ variant = "bar", onPicked, autoFocus, before }: GlobalSearchProps) => {
    const { allLevels, level } = useShellData();
    const { jumpTo } = useJumpToWord();
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(variant === "screen");
    const [hi, setHi] = useState(0);
    const [scope, setScope] = useState(
      () => loadStr(STORAGE_KEYS.searchScope) || "all",
    );
    const box = useRef<HTMLDivElement>(null);
    // "Semua level" means every level this access token may open.
    const allowed = useAccessStore((s) => s.session?.levels);

    const pool = useMemo<Flat[]>(
      () =>
        (scope === "level"
          ? [level]
          : LEVELS.map(([id]) => id).filter((id) =>
              allowed?.includes(id as never),
            )
        ).flatMap((id) =>
          flatten(allLevels[id]?.V || {}).map((x) => ({ ...x, lv: id })),
        ),
      [allLevels, scope, level, allowed],
    );
    // Indeks (termasuk bentuk V2/V3 per kartu) dihitung sekali per kumpulan kata, bukan per ketikan.
    const index = useMemo(() => buildSearchIndex(pool), [pool]);
    const ql = q.trim().toLowerCase();
    // Kata yang sama di beberapa level jadi satu baris (lihat groupHits).
    const results = useMemo(
      () => groupHits(searchVocab(index, ql, 120), level).slice(0, 40),
      [index, ql, level],
    );

    // Highlight goes back to the first result whenever the query changes
    // (reset during render rather than in an effect).
    const [hiFor, setHiFor] = useState(ql);
    if (hiFor !== ql) {
      setHiFor(ql);
      setHi(0);
    }
    useEffect(() => {
      if (variant === "screen") return;
      const onDoc = (e: MouseEvent) => {
        if (box.current && !box.current.contains(e.target as Node))
          setOpen(false);
      };
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }, [variant]);

    const lvName = (id?: string) => {
      const L = LEVELS.find((l) => l[0] === id);
      return L ? String(L[1]) : "";
    };
    const pick = (x: Flat) => {
      jumpTo(x.lv as string, x.w, x.it);
      setOpen(variant === "screen");
      setQ("");
      onPicked?.();
    };
    const listId = "global-search-results-" + variant;
    const show = open && (variant === "screen" || ql.length > 0);

    const panel = (
      <div className="flex flex-col">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
          {(["level", "all"] as const).map((s) => (
            <Pill
              key={s}
              size="sm"
              on={scope === s}
              title={
                s === "level"
                  ? "Cari hanya di level aktif"
                  : "Cari di semua level"
              }
              onClick={() => {
                setScope(s);
                saveStr(STORAGE_KEYS.searchScope, s);
              }}
            >
              {s === "level" ? "Level ini" : "Semua level"}
            </Pill>
          ))}
          <span className="ml-auto text-[13px] font-bold text-ink-2 tabular-nums">
            {ql
              ? `${results.length} hasil`
              : `${pool.length} kata${scope === "all" ? " · 4 level" : ""}`}
          </span>
        </div>
        {ql && results.length === 0 && (
          <div className="px-4 pt-1 pb-4 text-sm text-ink-2">
            Tidak ada kata yang cocok dengan &quot;{q}&quot;.
          </div>
        )}
        <div id={listId} role="listbox" aria-label="Hasil pencarian">
          {results.map(({ x, f, viaForm, places }, i) => {
            const on = i === hi;
            return (
              // One option per word. Clicking the row opens the first place
              // (the active level first); with more places, each level label
              // opens its own. Labels are plain text inside the option, not
              // buttons: an option must not contain other controls.
              <button
                type="button"
                role="option"
                aria-selected={on}
                key={itemKey(x.lv || "pre", x.w, x.it[0], x.it[1])}
                data-testid="search-result"
                onMouseEnter={() => setHi(i)}
                onClick={() => pick(x)}
                className={classNames(
                  "flex w-full cursor-pointer items-center gap-3 border-t-2 border-line px-3.5 py-2.5 text-left",
                  on ? "bg-accent-tint" : "bg-transparent",
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-base leading-[22px] font-extrabold wrap-anywhere text-ink">
                      <Marked text={x.it[1]} q={viaForm ? "" : ql} />
                    </span>
                    <TypeBadge type={x.it[0]} />
                  </span>
                  <span className="text-[13.5px] leading-[19px] font-semibold wrap-anywhere text-ink-2">
                    {x.it[3]}
                  </span>
                  {f && (
                    <FormsLine en={x.it[1]} f={f} hit={viaForm ? ql : ""} />
                  )}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {places.map((p) => (
                    <span
                      key={(p.lv || "pre") + p.w}
                      onClick={(e) => {
                        e.stopPropagation();
                        pick(p);
                      }}
                      className={classNames(
                        "rounded-md px-1.5 py-0.5 text-right text-[12.5px] leading-[18px] font-bold whitespace-nowrap text-ink-2",
                        places.length > 1 &&
                          "underline decoration-line decoration-2 underline-offset-[3px] hover:text-accent-edge hover:decoration-accent-line",
                      )}
                    >
                      {lvName(p.lv)} · M{p.w}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );

    const field = (
      <div
        className={classNames(
          "flex min-h-11 items-center gap-2.5 rounded-lg border-2 bg-sunken px-3.5 transition-colors focus-within:bg-surface",
          open ? "border-accent" : "border-control",
        )}
      >
        <LuSearch aria-hidden size={18} className="shrink-0 text-ink-2" />
        <input
          role="combobox"
          aria-expanded={show}
          aria-controls={listId}
          aria-label="Cari kata di semua level"
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHi((h) => Math.min(h + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHi((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter" && results[hi]) pick(results[hi].x);
            else if (e.key === "Escape" && variant === "bar") setOpen(false);
          }}
          placeholder="Cari kata di semua level…"
          className="min-w-0 flex-1 border-none bg-transparent text-base font-bold text-ink outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              if (variant === "bar") setOpen(false);
            }}
            className="cursor-pointer rounded-sm text-[13px] font-extrabold text-accent-edge underline decoration-2 underline-offset-[3px] focus-ring"
          >
            hapus
          </button>
        )}
        {variant === "bar" && !q && (
          <kbd className="hidden rounded-md border-2 border-line px-1.5 text-[11px] font-bold text-ink-2 lg:inline">
            Esc
          </kbd>
        )}
      </div>
    );

    if (variant === "screen") {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-2 px-4">
            {before}
            <div className="min-w-0 flex-1">{field}</div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{panel}</div>
          <p className="m-0 border-t-2 border-line px-4 py-3 text-[13px] font-semibold text-ink-2">
            Ketuk hasil untuk melompat ke katanya.
          </p>
        </div>
      );
    }

    return (
      <div ref={box} className="relative z-30 w-full">
        {field}
        {show && (
          <div className="absolute top-[calc(100%+6px)] right-0 left-0 max-h-[min(70vh,460px)] animate-[fade-in_120ms_var(--ease-lompat)] overflow-y-auto rounded-xl border-2 border-line bg-surface shadow-overlay">
            {panel}
          </div>
        )}
      </div>
    );
  },
);

GlobalSearch.displayName = "GlobalSearch";

export default GlobalSearch;

// The part of the word that matches the query gets the target-word band.
const Marked = ({ text, q }: { text: string; q: string }) => {
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <TargetMark>{text.slice(i, i + q.length)}</TargetMark>
      {text.slice(i + q.length)}
    </>
  );
};

// Baris bentuk kata kerja seperti di kartu ("ride → rode → ridden"). Kalau hasil muncul karena
// kata kunci cocok dengan V2/V3, bentuk itu ditebalkan supaya jelas kenapa kartunya ikut tampil.
const FormsLine = ({
  en,
  f,
  hit,
}: {
  en: string;
  f: VerbForms;
  hit: string;
}) => {
  const parts = f.same ? [en] : [en, f.v2, f.v3];
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-bold text-ink-2">
      <span
        className={classNames(
          "rounded-[6px] px-1.5 py-px text-[10.5px] font-extrabold tracking-[0.06em]",
          f.irregular ? "bg-bad-bg text-bad" : "bg-chip text-ink-2",
        )}
      >
        {f.irregular ? "IRREGULAR" : "REGULAR"}
      </span>
      <span className="wrap-anywhere text-ink-2">
        {parts.map((p, i) => (
          <span key={i}>
            {i > 0 && " → "}
            <span
              className={classNames(
                i > 0 &&
                  hit &&
                  p.toLowerCase().includes(hit) &&
                  "font-black text-ink",
              )}
            >
              {p}
            </span>
          </span>
        ))}
      </span>
      {f.same && <span className="text-ink-3">V1 = V2 = V3</span>}
    </span>
  );
};
