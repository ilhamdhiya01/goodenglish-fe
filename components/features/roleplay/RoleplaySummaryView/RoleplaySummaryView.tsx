import classNames from "classnames";
import React from "react";

import Jalak from "@/components/brand/Jalak";
import Correction from "@/components/shared/patterns/correction";
import WordTile from "@/components/shared/patterns/word-tile";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import { categoryTitle, formatDuration } from "@/lib/helpers/roleplay.helper";
import { speak } from "@/lib/helpers/speech.helper";
import type {
  RoleplayLine,
  RoleplaySummary,
  ScenarioRoleplay,
} from "@/lib/types/roleplay.types";

import MissionSteps from "../MissionSteps";

interface RoleplaySummaryViewProps {
  summary: RoleplaySummary;
  steps?: ScenarioRoleplay["steps"];
  transcript?: RoleplayLine[];
  /** Buttons under the summary ("Ulangi skenario ini", …). */
  actions?: React.ReactNode;
  className?: string;
}

const Stat = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex min-h-[34px] items-center gap-1 rounded-full border-2 border-line bg-surface px-3.5 text-[13px] font-extrabold whitespace-nowrap text-ink-2">
    {children}
  </span>
);

// The end-of-session review: the only place mistakes are shown. No score —
// mission, duration and turns, then corrections, "more natural" and the
// key phrases that were used.
const RoleplaySummaryView = ({
  summary,
  steps,
  transcript,
  actions,
  className,
}: RoleplaySummaryViewProps) => (
  <div className={classNames("flex flex-col gap-4", className)}>
    <Card
      tone={summary.missionComplete ? "greenBg" : "line"}
      pad="lg"
      className="flex-row items-start gap-4"
    >
      <Jalak
        mood={summary.missionComplete ? "bangga" : "senang"}
        className="shrink-0"
      />
      <div className="flex min-w-0 flex-col gap-2">
        <SectionLabel tone={summary.missionComplete ? "ok" : "muted"}>
          {summary.missionComplete ? "✓ MISI TERCAPAI" : "MISI BELUM TERCAPAI"}
        </SectionLabel>
        <p className="m-0 text-base leading-[22px] font-bold text-ink">
          {summary.summary}
        </p>
        <div className="flex flex-wrap gap-2">
          <Stat>
            Durasi{" "}
            <b className="text-ink tabular-nums">
              {formatDuration(summary.durationSec)}
            </b>
          </Stat>
          <Stat>
            <b className="text-ink tabular-nums">{summary.userTurns}</b> giliran
            bicara
          </Stat>
        </div>
      </div>
    </Card>

    {steps && (
      <Card className="gap-3">
        <SectionLabel>LANGKAH MISI</SectionLabel>
        <MissionSteps steps={steps} done={summary.stepsDone} />
      </Card>
    )}

    <Card className="gap-3">
      <div className="flex flex-col gap-1">
        <SectionLabel tone="green">KOREKSI</SectionLabel>
        <span className="text-[13.5px] leading-[19px] text-ink-2">
          Yang paling penting dulu. Dengarkan versi benarnya, lalu ucapkan
          ulang.
        </span>
      </div>
      {summary.corrections.length ? (
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {summary.corrections.map((c, i) => (
            <li
              key={i}
              className="flex flex-col gap-1.5 border-t-2 border-dashed border-line pt-3 first:border-t-0 first:pt-0"
            >
              <Correction
                wrong={c.original}
                right={c.corrected}
                speak={c.corrected}
                why={c.explanation}
              />
              <span className="pl-6 text-[12px] font-extrabold tracking-[0.05em] text-ink-3 uppercase">
                {categoryTitle(c.category)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <span className="text-sm font-bold text-ink-2">
          Tidak ada kesalahan penting di percakapan ini. Mantap!
        </span>
      )}
    </Card>

    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="gap-3">
        <SectionLabel>LEBIH NATURAL</SectionLabel>
        {summary.moreNatural.length ? (
          summary.moreNatural.map((n, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-[14px] leading-5 text-ink-2">
                {n.original}
              </span>
              <span className="flex items-center gap-2 text-[15px] leading-[22px] font-extrabold text-ink">
                <span aria-hidden>→</span>
                <span className="min-w-0">{n.natural}</span>
                <SpeakButton text={n.natural} size={30} icon={14} />
              </span>
            </div>
          ))
        ) : (
          <span className="text-[13.5px] font-semibold text-ink-2">
            Kalimatmu sudah terdengar wajar.
          </span>
        )}
      </Card>
      <Card className="gap-3">
        <SectionLabel>FRASA KUNCI YANG KAMU PAKAI</SectionLabel>
        {summary.keyPhrasesUsed.length ? (
          <div className="flex flex-wrap gap-2">
            {summary.keyPhrasesUsed.map((p) => (
              <WordTile
                key={p}
                title={`Dengarkan "${p}"`}
                onClick={() => speak(p)}
              >
                {p}
              </WordTile>
            ))}
          </div>
        ) : (
          <span className="text-[13.5px] font-semibold text-ink-2">
            Belum ada. Coba selipkan satu frasa kunci di sesi berikutnya.
          </span>
        )}
      </Card>
    </div>

    {transcript && transcript.length > 0 && (
      <details className="rounded-xl border-2 border-line bg-surface px-4 py-3">
        <summary className="min-h-11 cursor-pointer content-center text-sm font-extrabold text-ink focus-ring">
          Lihat transkrip ({transcript.length} baris)
        </summary>
        <ol className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
          {transcript.map((l, i) => (
            <li key={i} className="flex gap-2 text-[14px] leading-5">
              <span className="w-12 shrink-0 text-[12px] font-extrabold text-ink-3 uppercase">
                {l.role === "ai" ? "AI" : "Kamu"}
              </span>
              <span
                className={
                  l.role === "ai" ? "text-ink-2" : "font-bold text-ink"
                }
              >
                {l.text}
              </span>
            </li>
          ))}
        </ol>
      </details>
    )}

    {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
  </div>
);

export default RoleplaySummaryView;
