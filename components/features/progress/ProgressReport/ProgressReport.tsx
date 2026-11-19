"use client";

import Link from "next/link";
import React from "react";

import {
  dayLong,
  dayShort,
  Heatmap,
  WeeklyBars,
  WeeklyLine,
} from "@/components/shared/charts";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import { levelName } from "@/const/levels.constant";
import type { ProgressReport as Report } from "@/lib/helpers/progress-report.helper";
import { dayOf } from "@/lib/helpers/storage.helper";
import { SECTION_LABEL, type SectionId } from "@/lib/types/exam.types";

const Stat = ({ value, label }: { value: React.ReactNode; label: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[26px] leading-8 font-black text-ink tabular-nums">
      {value}
    </span>
    <span className="text-[12.5px] leading-[17px] font-bold text-ink-2">
      {label}
    </span>
  </div>
);

// Section titles sit under the page's h2, or right under the admin page's
// h1 when shown in a dialog.
const HeadingLevel = React.createContext<"h2" | "h3">("h3");

const Section = ({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) => {
  const level = React.useContext(HeadingLevel);
  const cls = "m-0 text-base font-black text-ink";
  return (
    <Card className="gap-3">
      <div className="flex flex-col gap-0.5">
        {level === "h2" ? (
          <h2 className={cls}>{title}</h2>
        ) : (
          <h3 className={cls}>{title}</h3>
        )}
        {sub && (
          <span className="text-[12.5px] font-semibold text-ink-2">{sub}</span>
        )}
      </div>
      {children}
    </Card>
  );
};

const CTA =
  "inline-flex min-h-9 shrink-0 items-center rounded-lg border-2 border-control px-3 text-[13px] font-extrabold text-accent-edge focus-ring hover:bg-sunken";

// "Progres": the report built by buildProgressReport, top to bottom.
// Sections without data are left out. `readOnly` (admin) hides the
// practice buttons.
const ProgressReport = ({
  report: r,
  readOnly = false,
  headingLevel = "h3",
}: {
  report: Report;
  readOnly?: boolean;
  headingLevel?: "h2" | "h3";
}) => {
  const sinceNote =
    r.since !== null && r.since > r.today - 7 * 12
      ? `Menit, review, dan kata hafal mulai dicatat sejak ${dayLong(r.since)}.`
      : null;
  const exams = r.exams.slice(0, 10);
  return (
    <HeadingLevel.Provider value={headingLevel}>
      <div className="flex flex-col gap-4">
        <Card className="gap-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Stat
              value={r.summary.streak}
              label="hari berturut-turut (streak)"
            />
            <Stat
              value={r.summary.minutes7d ?? "–"}
              label="menit belajar, 7 hari terakhir"
            />
            <Stat value={r.summary.known} label="kata hafal (semua level)" />
            <Stat
              value={r.summary.dueToday}
              label="kartu jatuh tempo hari ini"
            />
          </div>
          {sinceNote && (
            <span className="text-[12.5px] font-semibold text-ink-2">
              {sinceNote}
            </span>
          )}
        </Card>

        {!readOnly && r.focus.length > 0 && (
          <Section
            title="Fokus minggu ini"
            sub="Disusun otomatis dari latihanmu"
          >
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {r.focus.map((f) => (
                <li
                  key={f.title}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sunken px-3 py-2.5"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[14.5px] font-extrabold text-ink">
                      {f.title}
                    </span>
                    <span className="text-[13px] leading-[18px] text-ink-2">
                      {f.reason}
                    </span>
                  </span>
                  <Link href={f.href} className={CTA}>
                    {f.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {r.calendar && (
          <Section
            title="Kalender aktivitas"
            sub="12 minggu terakhir · warna = jumlah blok Rencana yang selesai hari itu (0–3)"
          >
            <Heatmap
              days={r.calendar}
              title={`Kalender aktivitas 12 minggu: ${r.calendar.filter((d) => d.blocks > 0).length} hari dengan blok Rencana selesai`}
            />
          </Section>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {r.learned && (
            <Section
              title="Kata hafal per minggu"
              sub="Kata yang ditandai hafal · 12 minggu terakhir"
            >
              <WeeklyBars
                points={r.learned}
                unit="kata"
                title={`Kata hafal per minggu, minggu ini ${r.learned.at(-1)?.value ?? 0} kata`}
              />
            </Section>
          )}
          {r.retention && (
            <Section
              title="Retensi Ulang"
              sub="% jawaban Ingat per minggu · 12 minggu terakhir"
            >
              <WeeklyLine
                points={r.retention.map((x) => ({
                  week: x.week,
                  pct: x.pct,
                  note: `${x.reviews} review`,
                }))}
                title="Retensi Ulang per minggu"
                detail={
                  <span className="text-[12.5px] font-semibold text-ink-2">
                    Jumlah review:{" "}
                    {r.retention
                      .filter((x) => x.reviews)
                      .slice(-4)
                      .map((x) => `${dayShort(x.week)}: ${x.reviews}`)
                      .join(" · ")}
                  </span>
                }
              />
            </Section>
          )}
        </div>

        {r.grammar.length > 0 && (
          <Section
            title="Akurasi per topik grammar"
            sub="Semua jawaban latihan Panduan grammar · dari yang terendah"
          >
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {r.grammar.map((g) => (
                <li
                  key={g.topic}
                  className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2.5 sm:grid-cols-[minmax(0,11rem)_1fr_auto_auto]"
                >
                  <span className="truncate text-[13.5px] font-bold text-ink">
                    {g.label}
                  </span>
                  <span className="h-2.5 rounded-full bg-track" aria-hidden>
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${Math.max(3, g.pct)}%` }}
                    />
                  </span>
                  <span className="text-[13px] font-extrabold text-ink tabular-nums">
                    {g.pct}%{" "}
                    <span className="font-semibold text-ink-2">
                      ({g.seen} soal)
                    </span>
                  </span>
                  {!readOnly && (
                    <Link
                      href={g.href}
                      className={`${CTA} col-span-3 justify-self-start sm:col-span-1`}
                      aria-label={`Latih ${g.label}`}
                    >
                      Latih
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {r.skills && (
          <Section
            title="Keseimbangan skill"
            sub="Menit belajar aktif per skill · 7 hari terakhir"
          >
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {r.skills.map((s) => {
                const max = Math.max(1, ...r.skills!.map((x) => x.minutes));
                return (
                  <li
                    key={s.id}
                    className="grid grid-cols-[6rem_1fr_auto] items-center gap-2.5"
                  >
                    <span className="text-[13.5px] font-bold text-ink">
                      {s.label}
                    </span>
                    <span className="h-2.5 rounded-full bg-track" aria-hidden>
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{
                          width: `${s.minutes ? Math.max(3, (s.minutes / max) * 100) : 0}%`,
                        }}
                      />
                    </span>
                    <span className="text-[13px] font-extrabold text-ink tabular-nums">
                      {s.minutes} menit
                    </span>
                  </li>
                );
              })}
            </ul>
            {r.skillNotes.map((n) => (
              <span key={n} className="text-[13px] font-semibold text-ink-2">
                {n}
              </span>
            ))}
          </Section>
        )}

        {(r.checkpoints.length > 0 || exams.length > 0 || r.placement) && (
          <Section title="Riwayat checkpoint dan ujian">
            {r.placement && (
              <span className="text-[13.5px] font-semibold text-ink">
                Tes penempatan {dayLong(dayOf(Date.parse(r.placement.date)))}:{" "}
                {r.placement.status === "skipped" || !r.placement.recommended
                  ? "dilewati (pilih level sendiri)"
                  : `${levelName(r.placement.recommended.level)} minggu ${r.placement.recommended.week}`}
              </span>
            )}
            {exams.length > 0 && (
              <div className="flex flex-col gap-1">
                <SectionLabel>UJIAN AKHIR LEVEL</SectionLabel>
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {exams.map((a) => (
                    <li
                      key={a.id}
                      className="text-[13.5px] font-semibold text-ink"
                    >
                      {dayLong(dayOf(Date.parse(a.date)))} ·{" "}
                      {levelName(a.level)} ·{" "}
                      <b className={a.passed ? "text-ok" : "text-bad"}>
                        {a.passed ? "Lulus" : "Belum lulus"} {a.pct}%
                      </b>{" "}
                      <span className="text-ink-2">
                        (
                        {(Object.keys(a.sections) as SectionId[])
                          .map(
                            (k) =>
                              `${SECTION_LABEL[k]} ${a.sections[k]!.right}/${a.sections[k]!.total}`,
                          )
                          .join(", ")}
                        )
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.checkpoints.length > 0 && (
              <div className="flex flex-col gap-1">
                <SectionLabel>CHECKPOINT MINGGUAN</SectionLabel>
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {r.checkpoints.slice(0, 12).map((c) => (
                    <li
                      key={`${c.level}|${c.week}`}
                      className="text-[13.5px] font-semibold text-ink"
                    >
                      {levelName(c.level)} minggu {c.week} ·{" "}
                      <b className={c.passed ? "text-ok" : "text-ink-2"}>
                        {c.passed ? "Lolos" : "Belum lolos"}
                      </b>{" "}
                      <span className="text-ink-2">
                        (Tes cepat{" "}
                        {c.quizBest === null
                          ? "belum dicoba"
                          : `${c.quizBest}/${c.quizTotal ?? 20}`}
                        , rekaman {c.rec ? "✓" : "–"}, main peran{" "}
                        {c.roleplayMin} menit)
                      </span>
                    </li>
                  ))}
                </ul>
                <span className="text-[12px] text-ink-2">
                  Syarat akurasi Bertanya tidak dicatat per minggu, jadi tidak
                  ikut dihitung di riwayat ini.
                </span>
              </div>
            )}
          </Section>
        )}
      </div>
    </HeadingLevel.Provider>
  );
};

export default ProgressReport;
