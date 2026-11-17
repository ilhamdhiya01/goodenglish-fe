"use client";

import Link from "next/link";
import React from "react";

import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import SectionLabel from "@/components/ui/section-label";
import { LEVELS } from "@/const/levels.constant";
import { stopSpeaking } from "@/lib/helpers/speech.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import { LISTENING_TABS, type ListeningTab } from "@/lib/types/listening.types";
import { ROUTES } from "@/routes";

import DictationTab from "../DictationTab";
import ListenAnswerTab from "../ListenAnswerTab";
import MinimalPairsTab from "../MinimalPairsTab";

const BODY: Record<ListeningTab, React.ComponentType> = {
  dikte: DictationTab,
  dengar: ListenAnswerTab,
  bunyi: MinimalPairsTab,
};

// "Menyimak": listening practice in three tabs, following the active level
// and week. `tab` is validated by app/(main)/listening/[tab]/page.tsx.
const ListeningPage = ({ tab }: { tab: ListeningTab }) => {
  const { level, week } = useShellData();
  const levelName = (LEVELS.find((l) => l[0] === level) || [])[1] || level;
  const Body = BODY[tab];
  return (
    <section className="flex flex-col gap-5">
      <div className="flex max-w-[760px] flex-col gap-1.5">
        <SectionLabel tone="green">
          {String(levelName).toUpperCase()} · MINGGU {week}
        </SectionLabel>
        <PageHeading>Menyimak</PageHeading>
        <Lead>
          Latih telinga memahami bahasa Inggris yang diucapkan. Soal diambil
          dari minggu ini dan minggu-minggu sebelumnya. Tahap berikutnya terbuka
          kalau akurasimu ≥ 80%.
        </Lead>
      </div>
      <nav
        aria-label="Bagian Menyimak"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {LISTENING_TABS.map((t) => (
          <Link
            key={t.id}
            href={ROUTES.listeningTab(t.id)}
            aria-current={t.id === tab ? "page" : undefined}
            onClick={stopSpeaking}
            className="hit-44 inline-flex min-h-[38px] shrink-0 items-center rounded-full border-2 border-control bg-surface px-4 text-sm font-extrabold whitespace-nowrap text-ink focus-ring hover:bg-sunken aria-[current=page]:border-accent-line aria-[current=page]:bg-accent-tint aria-[current=page]:text-accent-edge"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {/* Remount per tab and per level/week so a running set starts clean. */}
      <Body key={`${tab}-${level}-${week}`} />
    </section>
  );
};

export default ListeningPage;
