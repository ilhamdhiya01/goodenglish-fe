"use client";

import Link from "next/link";
import React from "react";

import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import { ROUTES } from "@/routes";
import { useRoleplayStore } from "@/stores/useRoleplayStore";

import { RoleplayHistoryRow } from "../RoleplayHistory/RoleplayHistory";

// "Riwayat main peran" on the Skenario page: the 3 latest sessions.
const RoleplayRecent = () => {
  const history = useRoleplayStore((s) => s.history);
  return (
    <Card className="gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel tone="green">RIWAYAT MAIN PERAN</SectionLabel>
        {history.length > 0 && (
          <Link
            href={ROUTES.ROLEPLAY_HISTORY}
            className="inline-flex min-h-11 items-center rounded-md text-[13px] font-extrabold text-accent-edge focus-ring"
          >
            Lihat semua ({history.length})
          </Link>
        )}
      </div>
      {history.length === 0 ? (
        <span className="text-[13.5px] font-semibold text-ink-2">
          Belum ada sesi. Tekan &quot;Main peran&quot; di skenario mana pun
          untuk mulai.
        </span>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {history.slice(0, 3).map((r) => (
            <li key={r.id}>
              <RoleplayHistoryRow r={r} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default RoleplayRecent;
