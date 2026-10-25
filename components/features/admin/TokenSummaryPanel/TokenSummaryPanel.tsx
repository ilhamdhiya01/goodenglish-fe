"use client";

import React from "react";

import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import TextButton from "@/components/ui/text-button";
import { formatDateTime } from "@/lib/helpers/date.helper";
import { useTokenSummary } from "@/lib/hooks/admin/useTokenSummary";

interface TokenSummaryPanelProps {
  id: string;
  label: string;
  onClose: () => void;
}

const Stat = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[28px] leading-none font-bold tabular-nums">
      {value}
    </span>
    <span className="font-mono text-[11px] tracking-[0.06em] text-muted">
      {label}
    </span>
  </div>
);

const TokenSummaryPanel = React.memo(
  ({ id, label, onClose }: TokenSummaryPanelProps) => {
    const { summary, isLoading } = useTokenSummary(id);

    return (
      <Card tone="ink" pad="lg">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel tone="green">
            PROGRES · {label.toUpperCase()}
          </SectionLabel>
          <TextButton onClick={onClose}>Tutup</TextButton>
        </div>
        {isLoading || !summary ? (
          <span className="font-mono text-xs text-muted">Memuat…</span>
        ) : (
          <>
            <div className="flex flex-wrap gap-8">
              <Stat value={summary.knownCount} label="KATA HAFAL" />
              <Stat value={summary.srsCount} label="DIJADWALKAN ULANG" />
              <Stat value={summary.ownSentenceCount} label="KALIMATKU" />
              <Stat value={summary.customWordCount} label="KATAKU" />
            </div>
            <span className="text-[13px] text-muted">
              Terakhir menyimpan progres:{" "}
              {summary.lastProgressAt
                ? formatDateTime(summary.lastProgressAt)
                : "belum pernah"}
            </span>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">Perangkat</span>
              {summary.sessions.length === 0 && (
                <span className="text-[13px] text-faint">
                  Belum pernah dipakai.
                </span>
              )}
              {summary.sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-t border-hairline pt-1.5 text-[13px]"
                >
                  <span
                    className="max-w-[60ch] truncate text-ink-3"
                    title={s.deviceLabel}
                  >
                    {s.deviceLabel}
                  </span>
                  <span
                    className={
                      s.active
                        ? "font-mono text-[11.5px] text-green"
                        : "font-mono text-[11.5px] text-faint"
                    }
                  >
                    {s.active ? "aktif" : "keluar"} · terakhir{" "}
                    {formatDateTime(s.lastSeenAt)}
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
