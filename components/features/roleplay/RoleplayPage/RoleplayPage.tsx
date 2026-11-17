"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import Jalak from "@/components/brand/Jalak";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import SectionLabel from "@/components/ui/section-label";
import { VOCAB_SCEN, VOCAB_SCEN_KEY } from "@/lib/content";
import { useRoleplaySession } from "@/lib/hooks/roleplay/useRoleplaySession";
import { useRoleplayUsage } from "@/lib/hooks/roleplay/useRoleplayUsage";
import { useOnline } from "@/lib/hooks/useOnline";
import { useRecorderSupported } from "@/lib/hooks/useVoiceRecorder";
import type { Scenario } from "@/lib/types/scenario.types";
import type { LevelId } from "@/lib/types/session.types";
import { ROUTES } from "@/routes";
import { useAccessStore } from "@/stores/useAccessStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { useTtsStore } from "@/stores/useTtsStore";

import RoleplayChat from "../RoleplayChat";
import RoleplaySetup from "../RoleplaySetup";
import RoleplaySummaryView from "../RoleplaySummaryView";

const SC = VOCAB_SCEN as Scenario[];
// 3–5 key phrases on the setup screen and in the AI's brief.
const PHRASES = 5;

const BackLink = () => (
  <Link
    href={ROUTES.SCENARIO}
    className="inline-flex min-h-11 items-center self-start rounded-md text-[13.5px] font-extrabold text-ink-2 focus-ring hover:text-ink"
  >
    ← Kembali ke Skenario
  </Link>
);

// /scenario/roleplay/[id]: "Main peran" for one scenario — setup, the
// conversation, then the summary (which is also saved to the history).
const RoleplayPage = ({ scenarioId }: { scenarioId: string }) => {
  const router = useRouter();
  const session = useAccessStore((s) => s.session);
  const allowed = !!session?.menus.includes("roleplay");
  const level = useLevelStore((s) => s.level) as LevelId;
  const week = useLevelStore((s) => s.week);
  const speed = useTtsStore((s) => s.speed);
  const online = useOnline();
  const canRecord = useRecorderSupported();
  const { usage } = useRoleplayUsage(allowed);
  const [showText, setShowText] = useState(level === "beginner");

  const scenario = SC.find((x) => x.id === scenarioId);
  const keyPhrases = useMemo(
    () =>
      (VOCAB_SCEN_KEY[scenarioId]?.phrases ?? [])
        .slice(0, PHRASES)
        .map(([en, id]) => [en, id] as [string, string]),
    [scenarioId],
  );
  const phraseList = useMemo(() => keyPhrases.map(([en]) => en), [keyPhrases]);

  const rp = useRoleplaySession({
    scenario: scenario ?? SC[0],
    level,
    week,
    phrases: phraseList,
    speed,
  });

  // Leaving mid-conversation loses it: ask first.
  const unsaved = rp.phase === "talking" && rp.userTurns > 0;
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  if (!scenario?.roleplay) {
    return (
      <section className="flex flex-col gap-4">
        <BackLink />
        <PageHeading>Skenario tidak ditemukan</PageHeading>
        <Lead>Pilih skenario lain dari daftar Skenario.</Lead>
      </section>
    );
  }

  if (!allowed) {
    return (
      <section className="flex flex-col gap-4">
        <BackLink />
        <Card tone="dashed" className="flex-row items-center gap-3">
          <Jalak mood="sedih" />
          <span className="text-sm leading-5 font-bold text-ink-2">
            Token ini belum bisa memakai Main peran. Hubungi admin untuk
            membukanya.
          </span>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex max-w-[760px] flex-col gap-1.5">
        {rp.phase === "setup" && <BackLink />}
        <SectionLabel tone="green">MAIN PERAN · {scenario.where}</SectionLabel>
        <PageHeading>{scenario.title}</PageHeading>
        {rp.phase === "setup" && (
          <Lead>
            Bicara langsung dengan AI yang memerankan lawan bicaramu. Jawab
            pakai suara (tombol mikrofon) atau ketik. Maksimal 12 giliran.
          </Lead>
        )}
      </div>

      {rp.phase === "setup" && (
        <>
          {rp.error && (
            <Card tone="redBg" pad="sm" className="gap-2" role="alert">
              <span className="text-sm font-bold text-ink">
                {rp.error.message}
              </span>
              {rp.error.retry && (
                <Button
                  size="sm"
                  variant="green"
                  className="self-start"
                  disabled={rp.pending !== null}
                  onClick={rp.retry}
                >
                  Coba lagi
                </Button>
              )}
            </Card>
          )}
          <RoleplaySetup
            scenario={scenario}
            phrases={keyPhrases}
            usage={usage}
            showText={showText}
            onShowText={setShowText}
            canRecord={canRecord}
            online={online}
            starting={rp.pending === "start"}
            onStart={() => void rp.start()}
          />
        </>
      )}

      {rp.phase === "talking" && (
        <RoleplayChat
          scenario={scenario}
          session={rp}
          showText={showText}
          onShowText={setShowText}
          online={online}
        />
      )}

      {rp.phase === "summary" && rp.summary && (
        <RoleplaySummaryView
          summary={rp.summary}
          steps={scenario.roleplay.steps}
          transcript={rp.transcript}
          actions={
            <>
              <Button variant="green" onClick={rp.reset}>
                Ulangi skenario ini
              </Button>
              <Button onClick={() => router.push(ROUTES.SCENARIO)}>
                Coba skenario lain
              </Button>
              <Button onClick={() => router.push(ROUTES.ROLEPLAY_HISTORY)}>
                Riwayat main peran
              </Button>
            </>
          }
        />
      )}
    </section>
  );
};

export default RoleplayPage;
