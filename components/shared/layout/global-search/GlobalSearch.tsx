"use client";

import classNames from "classnames";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { LEVELS } from "@/const/levels.constant";
import { typeDef } from "@/const/vocab-types.constant";
import type { Flat } from "@/lib/helpers/level-data.helper";
import { flatten } from "@/lib/helpers/level-data.helper";
import {
  itemKey,
  loadStr,
  saveStr,
  STORAGE_KEYS,
} from "@/lib/helpers/storage.helper";
import type { VerbForms } from "@/lib/helpers/verb-forms.helper";
import { buildSearchIndex, searchVocab } from "@/lib/helpers/verb-forms.helper";
import { useJumpToWord } from "@/lib/hooks/useJumpToWord";
import { useShellData } from "@/lib/hooks/useShellData";
import { useAccessStore } from "@/stores/useAccessStore";

// Pencarian global di atas pilihan level: ketik → dropdown hasil dari semua level →
// klik → pindah ke level & minggu kata itu.
const GlobalSearch = React.memo(() => {
  const { allLevels, level } = useShellData();
  const { jumpTo } = useJumpToWord();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
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
  const results = useMemo(() => searchVocab(index, ql), [index, ql]);

  // Highlight goes back to the first result whenever the query changes
  // (reset during render rather than in an effect).
  const [hiFor, setHiFor] = useState(ql);
  if (hiFor !== ql) {
    setHiFor(ql);
    setHi(0);
  }
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const lvName = (id?: string) => {
    const L = LEVELS.find((l) => l[0] === id);
    return L ? String(L[1]) : "";
  };
  const pick = (x: Flat) => {
    jumpTo(x.lv as string, x.w, x.it);
    setOpen(false);
    setQ("");
  };
  const show = open && ql.length > 0;

  return (
    <div ref={box} className="relative z-20">
      <div className="flex h-[46px] items-center gap-2.5 rounded-[10px] border-[1.5px] border-ink bg-card px-3.5">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b665c"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
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
            else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Cari kata di semua level…"
          className="min-w-0 flex-1 border-none bg-transparent font-sans text-[15px] text-ink outline-none max-sm:text-sm"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setOpen(false);
            }}
            className="cursor-pointer border-b border-dotted border-muted bg-transparent p-0 text-xs text-muted"
          >
            hapus
          </button>
        )}
        <div className="inline-flex h-7 shrink-0 overflow-hidden rounded-full border border-line-2">
          {(["level", "all"] as const).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => {
                setScope(s);
                saveStr(STORAGE_KEYS.searchScope, s);
              }}
              title={
                s === "level"
                  ? "Cari hanya di level aktif"
                  : "Cari di semua level"
              }
              className={classNames(
                "cursor-pointer border-none px-2.5 font-sans text-[11.5px] font-semibold",
                scope === s ? "bg-ink text-paper" : "bg-transparent text-ink",
              )}
            >
              {s === "level" ? "Level ini" : "Semua"}
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] tracking-[0.06em] whitespace-nowrap text-faint max-sm:hidden">
          {pool.length} KATA{scope === "all" ? " · 4 LEVEL" : ""}
        </span>
      </div>
      {show && (
        <div className="absolute top-[calc(100%+6px)] right-0 left-0 flex max-h-[420px] flex-col overflow-y-auto rounded-[10px] border-[1.5px] border-ink bg-card shadow-[0_12px_32px_rgba(29,27,22,.14)]">
          {results.length === 0 && (
            <div className="px-4 py-4.5 text-sm text-muted">
              Tidak ada kata yang cocok dengan &quot;{q}&quot;.
            </div>
          )}
          {results.map(({ x, f, viaForm }, i) => {
            const T = typeDef(x.it[0]);
            const on = i === hi;
            return (
              <button
                type="button"
                key={itemKey(x.lv || "pre", x.w, x.it[0], x.it[1])}
                onMouseEnter={() => setHi(i)}
                onClick={() => pick(x)}
                className={classNames(
                  "flex cursor-pointer items-center gap-3 border-none px-3.5 py-2.5 text-left font-sans",
                  i ? "border-t border-hairline" : "",
                  on ? "bg-green-bg" : "bg-transparent",
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[15px] font-bold wrap-anywhere">
                      {x.it[1]}
                    </span>
                    <span
                      className={classNames(
                        "rounded px-1.5 py-px font-mono text-[10.5px]",
                        T.chip,
                      )}
                    >
                      {T.label}
                    </span>
                  </div>
                  <span className="text-[13px] wrap-anywhere text-muted">
                    {x.it[3]}
                  </span>
                  {f && (
                    <FormsLine en={x.it[1]} f={f} hit={viaForm ? ql : ""} />
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="font-mono text-[11px] tracking-[0.04em] text-green">
                    {lvName(x.lv).toUpperCase()}
                  </span>
                  <span className="font-mono text-[11px] text-faint">
                    MINGGU {String(x.w).padStart(2, "0")} →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

GlobalSearch.displayName = "GlobalSearch";

export default GlobalSearch;

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
    <span className="flex flex-wrap items-center gap-1.5 font-mono text-[11.5px] text-muted">
      <span
        className={classNames(
          "rounded px-1 py-px text-[9.5px] tracking-[0.06em]",
          f.irregular ? "bg-red-bg text-red" : "bg-green-bg text-green",
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
                  "font-bold text-ink",
              )}
            >
              {p}
            </span>
          </span>
        ))}
      </span>
      {f.same && <span className="text-faint">V1 = V2 = V3</span>}
    </span>
  );
};
