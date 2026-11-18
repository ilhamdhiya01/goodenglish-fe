"use client";

import React from "react";

import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import TextButton from "@/components/ui/text-button";
import { categoryOf } from "@/const/mistake-categories.constant";
import { formatDateTime } from "@/lib/helpers/date.helper";
import { useTokenSummary } from "@/lib/hooks/admin/useTokenSummary";
import type { RoleplayWeek } from "@/lib/types/admin.types";

interface TokenSummaryPanelProps {
  id: string;
  label: string;
  onClose: () => void;
}

const Stat = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[28px] leading-none font-black text-ink tabular-nums">
      {value}
    </span>
    <SectionLabel>{label}</SectionLabel>
  </div>
);

// "17 Nov": the Monday a week starts on.
const weekLabel = (ymd: string) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });

// Main peran per calendar week (Monday–Sunday, WIB), newest first.
const RoleplayWeeks = ({ weeks }: { weeks: RoleplayWeek[] }) => (
  <div className="flex flex-col">
    <SectionLabel className="pb-1.5">Main peran per minggu</SectionLabel>
    {weeks.every((w) => w.sessions === 0) ? (
      <span className="text-[13.5px] font-semibold text-ink-2">
        Belum ada sesi main peran dalam {weeks.length} minggu terakhir.
      </span>
    ) : (
      <table className="w-full border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="border-b-2 border-line text-[12px] font-extrabold tracking-[0.07em] text-ink-3 uppercase">
            <th scope="col" className="py-1.5 pr-3">
              Minggu mulai
            </th>
            <th scope="col" className="py-1.5 pr-3 text-right">
              Sesi
            </th>
            <th scope="col" className="py-1.5 text-right">
              Menit
            </th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.weekStart} className="border-b-2 border-line">
              <td className="py-1.5 pr-3 font-bold text-ink">
                {weekLabel(w.weekStart)}
              </td>
              <td className="py-1.5 pr-3 text-right font-bold tabular-nums">
                {w.sessions}
              </td>
              <td className="py-1.5 text-right font-bold tabular-nums">
                {w.minutes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const TokenSummaryPanel = React.memo(
  ({ id, label, onClose }: TokenSummaryPanelProps) => {
    const { summary, isLoading } = useTokenSummary(id);

    return (
      <Card tone="line" pad="lg" className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel tone="green">
            PROGRES · {label.toUpperCase()}
          </SectionLabel>
          <TextButton className="hit-44" onClick={onClose}>
            Tutup
          </TextButton>
        </div>
        {isLoading || !summary ? (
          <span className="text-[13px] font-bold text-ink-2">Memuat…</span>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 md:flex md:flex-wrap">
              <Stat value={summary.knownCount} label="KATA HAFAL" />
              <Stat value={summary.srsCount} label="DIJADWALKAN ULANG" />
              <Stat value={summary.ownSentenceCount} label="KALIMATKU" />
              <Stat
                value={
                  summary.customWordCount - (summary.personalWordCount ?? 0)
                }
                label="KATAKU"
              />
              {summary.personalWordCount !== undefined && (
                <Stat
                  value={summary.personalWordCount}
                  label="KARTU PRIBADI (BACAAN)"
                />
              )}
              {summary.mistakeActiveCount !== undefined && (
                <Stat
                  value={summary.mistakeActiveCount}
                  label="KESALAHAN AKTIF"
                />
              )}
              {summary.mistakeMasteredCount !== undefined && (
                <Stat
                  value={summary.mistakeMasteredCount}
                  label="KESALAHAN DIKUASAI"
                />
              )}
              {summary.readingDoneCount !== undefined && (
                <Stat value={summary.readingDoneCount} label="BACAAN SELESAI" />
              )}
            </div>
            {!!summary.topMistakeCategories?.length && (
              <span className="text-[13.5px] font-semibold text-ink-2">
                Kesalahan terbanyak:{" "}
                {summary.topMistakeCategories
                  .map((c) => `${categoryOf(c.id).label} (${c.count})`)
                  .join(", ")}
              </span>
            )}
            <span className="text-[13.5px] font-semibold text-ink-2">
              Terakhir menyimpan progres:{" "}
              {summary.lastProgressAt
                ? formatDateTime(summary.lastProgressAt)
                : "belum pernah"}
            </span>
            {summary.roleplayWeeks && (
              <RoleplayWeeks weeks={summary.roleplayWeeks} />
            )}
            <div className="flex flex-col">
              <SectionLabel className="pb-1.5">Perangkat</SectionLabel>
              {summary.sessions.length === 0 && (
                <span className="text-[13.5px] font-semibold text-ink-2">
                  Belum pernah dipakai.
                </span>
              )}
              {summary.sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-0.5 border-t-2 border-line py-2 text-[13.5px]"
                >
                  <span
                    className="max-w-[60ch] truncate font-bold text-ink"
                    title={s.deviceLabel}
                  >
                    {s.deviceLabel}
                  </span>
                  <span className="text-[13px] font-semibold text-ink-2">
                    <span
                      className={
                        s.active ? "font-extrabold text-ok" : "font-extrabold"
                      }
                    >
                      <span aria-hidden>{s.active ? "● " : "○ "}</span>
                      {s.active ? "aktif" : "keluar"}
                    </span>{" "}
                    · terakhir {formatDateTime(s.lastSeenAt)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    );
  },
);

TokenSummaryPanel.displayName = "TokenSummaryPanel";

export default TokenSummaryPanel;
