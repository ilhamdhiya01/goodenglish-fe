"use client";

import classNames from "classnames";
import Link from "next/link";
import React, { useState } from "react";

import Jalak from "@/components/brand/Jalak";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import SectionLabel from "@/components/ui/section-label";
import { VOCAB_SCEN } from "@/lib/content";
import {
  formatDuration,
  formatSessionDate,
} from "@/lib/helpers/roleplay.helper";
import type { RoleplayRecord } from "@/lib/types/roleplay.types";
import type { Scenario } from "@/lib/types/scenario.types";
import { ROUTES } from "@/routes";
import { useRoleplayStore } from "@/stores/useRoleplayStore";

import RoleplaySummaryView from "../RoleplaySummaryView";

const SC = VOCAB_SCEN as Scenario[];
const scenarioOf = (id: string) => SC.find((s) => s.id === id);

/** One line of the history: scenario, date, duration, turns, mission. */
export const RoleplayHistoryRow = ({
  r,
  open,
  onToggle,
}: {
  r: RoleplayRecord;
  open?: boolean;
  onToggle?: () => void;
}) => {
  const sc = scenarioOf(r.scenarioId);
  // The row is laid out by an inner span, not by the <button> itself: some
  // Safari versions ignore flex on buttons and the title then spills out.
  const body = (
    <span className="flex w-full min-w-0 items-center justify-between gap-3">
      <span className="block min-w-0 flex-1 overflow-hidden text-left">
        <span className="block w-full truncate text-[15px] font-extrabold text-ink">
          {sc?.title ?? r.scenarioId}
        </span>
        <span className="mt-0.5 block w-full truncate text-[12.5px] font-semibold text-ink-2">
          {formatSessionDate(r.startedAt)} · {formatDuration(r.durationSec)} ·{" "}
          {r.userTurns} giliran
        </span>
      </span>
      <span
        className={classNames(
          "shrink-0 rounded-full border-2 px-2.5 py-0.5 text-[12px] font-extrabold",
          r.missionComplete
            ? "border-ok-line bg-ok-bg text-ok"
            : "border-line bg-sunken text-ink-2",
        )}
      >
        {r.missionComplete ? "✓ Misi tercapai" : "Misi belum"}
      </span>
    </span>
  );
  const cls =
    "block min-h-14 w-full cursor-pointer overflow-hidden rounded-lg px-3 py-2 focus-ring hover:bg-sunken";
  return onToggle ? (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      className={classNames(cls, "border-0 bg-transparent")}
    >
      {body}
    </button>
  ) : (
    <Link href={`${ROUTES.ROLEPLAY_HISTORY}#${r.id}`} className={cls}>
      {body}
    </Link>
  );
};

// /scenario/history: every saved session, newest first. Opening one shows
// its summary and transcript.
const RoleplayHistory = () => {
  const history = useRoleplayStore((s) => s.history);
  const [open, setOpen] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? window.location.hash.slice(1) || null
      : null,
  );

  return (
    <section className="flex flex-col gap-5">
      <div className="flex max-w-[760px] flex-col gap-1.5">
        <Link
          href={ROUTES.SCENARIO}
          className="inline-flex min-h-11 items-center self-start rounded-md text-[13.5px] font-extrabold text-ink-2 focus-ring hover:text-ink"
        >
          ← Kembali ke Skenario
        </Link>
        <PageHeading>Riwayat main peran</PageHeading>
        <Lead>
          Sesi yang sudah selesai, lengkap dengan transkrip dan rangkumannya.
          Koreksinya juga tersimpan untuk Buku kesalahanku.
        </Lead>
      </div>

      {history.length === 0 ? (
        <Card tone="dashed" className="flex-row items-center gap-3">
          <Jalak mood="biasa" />
          <span className="text-sm leading-5 font-bold text-ink-2">
            Belum ada sesi. Buka Skenario, pilih satu situasi, lalu tekan
            &quot;Main peran&quot;.
          </span>
        </Card>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {history.map((r) => {
            const sc = scenarioOf(r.scenarioId);
            const isOpen = open === r.id;
            return (
              <li key={r.id} id={r.id}>
                <Card pad="sm" className="gap-2">
                  <RoleplayHistoryRow
                    r={r}
                    open={isOpen}
                    onToggle={() => setOpen(isOpen ? null : r.id)}
                  />
                  {isOpen && (
                    <RoleplaySummaryView
                      className="px-1 pb-2"
                      summary={r.summary}
                      steps={sc?.roleplay?.steps}
                      transcript={r.transcript}
                      actions={
                        sc?.roleplay ? (
                          <Link
                            href={ROUTES.roleplay(r.scenarioId)}
                            className="inline-flex min-h-11 items-center rounded-lg border-2 border-control px-4 text-[13.5px] font-extrabold tracking-[0.06em] text-ink uppercase focus-ring"
                          >
                            Main lagi
                          </Link>
                        ) : undefined
                      }
                    />
                  )}
                </Card>
              </li>
            );
          })}
        </ol>
      )}
      <SectionLabel tone="faint">
        Menyimpan {history.length} sesi terakhir (maksimal 50).
      </SectionLabel>
    </section>
  );
};

export default RoleplayHistory;
