"use client";

import classNames from "classnames";
import React, { useCallback, useMemo, useState } from "react";
import { LuArrowDown, LuArrowUp } from "react-icons/lu";

import Card from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import Select from "@/components/ui/select";
import { levelName } from "@/const/levels.constant";
import { formatDate, formatDateTime } from "@/lib/helpers/date.helper";
import { useLearnersOverview } from "@/lib/hooks/admin/useLearnersOverview";
import type { LearnerOverview as Row } from "@/lib/types/admin.types";

import TokenSummaryPanel from "../TokenSummaryPanel";

const DAY_MS = 86_400_000;
export const INACTIVE_DAYS = 3;

type SortKey =
  | "label"
  | "lastActiveAt"
  | "streak"
  | "minutes7d"
  | "wordsThisWeek"
  | "retention"
  | "level";

// [key, column heading, phone label]
const COLUMNS: readonly [SortKey, string, string][] = [
  ["label", "Nama", "Nama"],
  ["lastActiveAt", "Terakhir aktif", "Terakhir aktif"],
  ["streak", "Streak (hari)", "Streak"],
  ["minutes7d", "Menit · 7 hari", "Menit 7 hari"],
  ["wordsThisWeek", "Kata hafal · minggu ini", "Kata minggu ini"],
  ["retention", "Retensi · 28 hari", "Retensi 28 hari"],
  ["level", "Level", "Level"],
];

/** Days since the learner was last active; null = never. */
export const idleDays = (r: Pick<Row, "lastActiveAt">, now: number) =>
  r.lastActiveAt === null
    ? null
    : Math.floor((now - Date.parse(r.lastActiveAt)) / DAY_MS);

export const isInactive = (r: Pick<Row, "lastActiveAt">, now: number) => {
  const d = idleDays(r, now);
  return d === null || d >= INACTIVE_DAYS;
};

const sortValue = (r: Row, k: SortKey): string | number | null => {
  if (k === "lastActiveAt")
    return r.lastActiveAt === null ? null : Date.parse(r.lastActiveAt);
  if (k === "level") return r.level === null ? null : levelName(r.level);
  return r[k];
};

/** Sorted copy; empty values (never active, no reviews) always go last. */
export const sortLearners = (
  rows: Row[],
  key: SortKey,
  dir: "asc" | "desc",
): Row[] =>
  [...rows].sort((a, b) => {
    const x = sortValue(a, key);
    const y = sortValue(b, key);
    if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
    const c =
      typeof x === "string"
        ? x.localeCompare(String(y), "id")
        : x - (y as number);
    return dir === "asc" ? c : -c;
  });

const TD =
  "md:border-b-2 md:border-line md:px-3 md:py-2.5 max-md:flex max-md:items-baseline max-md:gap-3";

const CellLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="w-[130px] shrink-0 text-[12.5px] leading-[18px] font-extrabold tracking-[0.07em] text-ink-3 uppercase md:hidden">
    {children}
  </span>
);

// Admin › Kelola › Ringkasan pelajar: every learner token in one sortable
// table. Rows not active for 3+ days are marked red (with a word, not colour
// alone); the name opens the same read-only "Progres" as Token akses.
const LearnerOverview = () => {
  const { learners, loadedAt: now, isLoading, isError } = useLearnersOverview();
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "lastActiveAt",
    dir: "asc",
  });
  const [open, setOpen] = useState<Row | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const rows = useMemo(
    () => sortLearners(learners ?? [], sort.key, sort.dir),
    [learners, sort],
  );
  const inactive = rows.filter((r) => isInactive(r, now)).length;

  const toggle = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "label" || key === "level" ? "asc" : "desc" },
    );

  return (
    <div className="flex flex-col gap-4">
      {open && (
        <Modal label={`Progres ${open.label}`} size="lg" onClose={close}>
          <TokenSummaryPanel
            id={open.id}
            label={open.label}
            menus={open.menus}
            onClose={close}
          />
        </Modal>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <span className="text-[13.5px] font-semibold text-ink-2">
          {learners
            ? `${learners.length} pelajar · ${inactive} tidak aktif ${INACTIVE_DAYS}+ hari`
            : " "}
        </span>
        {/* Phones: the table header is hidden, so sorting lives here. */}
        <label className="flex w-full flex-col gap-1 md:hidden">
          <span className="text-[12.5px] font-extrabold tracking-[0.07em] text-ink-3 uppercase">
            Urutkan
          </span>
          <Select
            value={`${sort.key}:${sort.dir}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(":") as [
                SortKey,
                "asc" | "desc",
              ];
              setSort({ key, dir });
            }}
          >
            {COLUMNS.flatMap(([k, , short]) => [
              <option key={`${k}:asc`} value={`${k}:asc`}>
                {short} ↑
              </option>,
              <option key={`${k}:desc`} value={`${k}:desc`}>
                {short} ↓
              </option>,
            ])}
          </Select>
        </label>
      </div>

      <Card
        tone="line"
        pad="sm"
        className="max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none"
      >
        {isLoading ? (
          <span className="p-2 text-[13px] font-bold text-ink-2">Memuat…</span>
        ) : isError ? (
          <span className="p-2 text-sm font-bold text-bad">
            Gagal memuat ringkasan pelajar.
          </span>
        ) : rows.length === 0 ? (
          <span className="p-2 text-sm font-bold text-ink-2">
            Belum ada token pelajar.
          </span>
        ) : (
          <table className="w-full border-collapse text-left text-sm max-md:block">
            <thead className="max-md:hidden">
              <tr>
                {COLUMNS.map(([k, head]) => (
                  <th
                    key={k}
                    scope="col"
                    aria-sort={
                      sort.key === k
                        ? sort.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={classNames(
                      "border-b-2 border-line px-1.5 py-1.5",
                      k !== "label" && k !== "level" && k !== "lastActiveAt"
                        ? "text-right"
                        : "",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(k)}
                      className="inline-flex min-h-9 items-center gap-1 rounded-md px-1.5 text-[12.5px] leading-[18px] font-extrabold tracking-[0.07em] text-ink-3 uppercase focus-ring hover:bg-sunken"
                    >
                      {head}
                      {sort.key === k &&
                        (sort.dir === "asc" ? (
                          <LuArrowUp aria-hidden size={13} />
                        ) : (
                          <LuArrowDown aria-hidden size={13} />
                        ))}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="max-md:flex max-md:flex-col max-md:gap-3">
              {rows.map((r) => {
                const idle = idleDays(r, now);
                const red = isInactive(r, now);
                const num = "md:text-right font-bold tabular-nums";
                return (
                  <tr
                    key={r.id}
                    data-inactive={red || undefined}
                    className={classNames(
                      "align-top md:h-11",
                      "max-md:flex max-md:flex-col max-md:gap-2 max-md:rounded-xl max-md:border-2 max-md:p-4 max-md:edge-card",
                      red
                        ? "bg-bad-bg max-md:border-bad-line"
                        : "max-md:border-line max-md:bg-surface",
                    )}
                  >
                    <td className={TD}>
                      <CellLabel>Nama</CellLabel>
                      <span className="flex flex-col items-start gap-0.5">
                        <button
                          type="button"
                          onClick={() => setOpen(r)}
                          className="rounded-sm text-left font-extrabold text-accent-edge underline-offset-2 focus-ring hover:underline"
                        >
                          {r.label}
                        </button>
                        {r.status !== "active" && (
                          <span className="text-[12.5px] font-semibold text-ink-2">
                            {r.status === "revoked"
                              ? "Token nonaktif"
                              : "Token kedaluwarsa"}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className={TD}>
                      <CellLabel>Terakhir aktif</CellLabel>
                      <span className="flex flex-col gap-0.5">
                        <span
                          className={classNames(
                            "font-bold",
                            red ? "text-bad" : "text-ink",
                          )}
                        >
                          {red && <span aria-hidden>● </span>}
                          {idle === null
                            ? "Belum pernah"
                            : idle === 0
                              ? "Hari ini"
                              : `${idle} hari lalu`}
                          {red && (
                            <span className="sr-only">
                              {" "}
                              (tidak aktif {INACTIVE_DAYS}+ hari)
                            </span>
                          )}
                        </span>
                        {r.lastActiveAt && (
                          <span className="text-[12.5px] font-semibold text-ink-2">
                            {formatDate(r.lastActiveAt)}
                          </span>
                        )}
                        {/* Opening the app isn't learning: shown apart. */}
                        {r.lastOpenedAt && (
                          <span className="text-[12.5px] font-semibold text-ink-2">
                            Dibuka {formatDateTime(r.lastOpenedAt)}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className={classNames(TD, num)}>
                      <CellLabel>Streak</CellLabel>
                      {r.streak} hari
                    </td>
                    <td className={classNames(TD, num)}>
                      <CellLabel>Menit 7 hari</CellLabel>
                      {r.minutes7d} menit
                    </td>
                    <td className={classNames(TD, num)}>
                      <CellLabel>Kata minggu ini</CellLabel>
                      {r.wordsThisWeek} kata
                    </td>
                    <td className={classNames(TD, num)}>
                      <CellLabel>Retensi 28 hari</CellLabel>
                      {r.retention === null ? (
                        <span className="font-semibold text-ink-2">
                          belum ada review
                        </span>
                      ) : (
                        <span>
                          {r.retention}%{" "}
                          <span className="font-semibold text-ink-2">
                            ({r.reviews28d} review)
                          </span>
                        </span>
                      )}
                    </td>
                    <td className={classNames(TD, "font-bold")}>
                      <CellLabel>Level</CellLabel>
                      {r.level ? levelName(r.level) : "–"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default LearnerOverview;
