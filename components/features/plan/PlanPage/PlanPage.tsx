"use client";

import classNames from "classnames";
import { useRouter } from "next/navigation";
import React from "react";
import { LuEllipsis } from "react-icons/lu";

import Jalak from "@/components/brand/Jalak";
import { Tests } from "@/components/features/tests";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import IconButton from "@/components/ui/icon-button";
import Lead from "@/components/ui/lead";
import Menu from "@/components/ui/menu";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import TextButton from "@/components/ui/text-button";
import { ASK_RULES, CHEERS } from "@/const/plan.constant";
import { quizPassed } from "@/lib/helpers/quiz-pass.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import { useTodayPlan } from "@/lib/hooks/useTodayPlan";
import { useAskPracticeStore } from "@/stores/useAskPracticeStore";
import { confirmDialog } from "@/stores/useConfirmStore";
import { usePlanStore } from "@/stores/usePlanStore";
import { roleplaySeconds, useRoleplayStore } from "@/stores/useRoleplayStore";

// A read-only count shaped like a Pill ("Hari ini 1/3", "Streak 6 hari").
const Stat = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex min-h-[34px] items-center gap-1 rounded-full border-2 border-line bg-surface px-3.5 text-[13px] font-extrabold whitespace-nowrap text-ink-2">
    {children}
  </span>
);

// Manual checkpoint item: a 44px checkbox (state also in aria-checked).
const CheckBox = ({
  on,
  label,
  onClick,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={on}
    aria-label={label}
    onClick={onClick}
    className="hit-44 inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 border-control bg-surface text-sm font-black text-on-accent focus-ring aria-checked:border-accent-edge aria-checked:bg-accent"
  >
    {on ? "✓" : ""}
  </button>
);

// Number bubble of a block: ✓ when done, filled blue when it's its turn.
const BlockNo = ({
  no,
  state,
}: {
  no: string;
  state: "done" | "now" | "next";
}) => (
  <span
    aria-hidden
    className={classNames(
      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-black",
      state === "done"
        ? "bg-ok-bg text-ok"
        : state === "now"
          ? "bg-accent text-on-accent"
          : "bg-chip text-ink-2",
    )}
  >
    {state === "done" ? "✓" : no}
  </span>
);

// Halaman Rencana: rutinitas harian 3 blok (dicentang otomatis oleh
// PlanAutoCheck) + checkpoint mingguan.
const PlanPage = React.memo(() => {
  const { level, week } = useShellData();
  const P = usePlanStore((s) => s.plan);
  const setPlan = usePlanStore((s) => s.setPlan);
  const askPrac = useAskPracticeStore((s) => s.stats);
  const roleplayHistory = useRoleplayStore((s) => s.history);
  const router = useRouter();

  const {
    day,
    dow,
    sat,
    sun,
    rule,
    ruleNo,
    pronName,
    blocks,
    doneN,
    allDone,
    streak,
  } = useTodayPlan();
  const weekQuiz = (P.quiz || []).filter(
    (q) => q.scope === "week" && q.level === level && q.week === week,
  );
  // Best by share: older entries had 20 questions, newer ones say how many.
  const best = weekQuiz.reduce<(typeof weekQuiz)[number] | null>(
    (b, q) =>
      !b || q.score / (q.total ?? 20) > b.score / (b.total ?? 20) ? q : b,
    null,
  );
  const ap = askPrac[rule] || { seen: 0, right: 0 };
  const askAcc = ap.seen >= 20 ? Math.round((ap.right / ap.seen) * 100) : null;
  const wkKey = level + "|" + week;
  const rpMinutes = Math.floor(
    roleplaySeconds(roleplayHistory, level, week) / 60,
  );
  const wk = P.week?.[wkKey] || {};
  const toggleWk = (k: "rec" | "gpt") =>
    setPlan((p) => ({
      ...p,
      week: {
        ...(p.week || {}),
        [wkKey]: { ...(p.week?.[wkKey] || {}), [k]: !p.week?.[wkKey]?.[k] },
      },
    }));

  const checks = [
    {
      name: 'Tes cepat "Minggu ini" ≥ 80%',
      ok: !!best && quizPassed(best.score, best.total ?? 20),
      val: best
        ? `terbaik ${best.score} / ${best.total ?? 20}`
        : "belum dicoba",
      go: () => router.push("/vocab"),
    },
    {
      name: `Latihan Bertanya ${ruleNo} ≥ 80% (min. 20 soal)`,
      ok: askAcc !== null && askAcc >= 80,
      val:
        askAcc === null
          ? ap.seen
            ? `${ap.seen} soal dijawab, butuh 20`
            : "belum dicoba"
          : `akurasi ${askAcc}%`,
      go: () => router.push("/grammar/ask"),
    },
    {
      name: "Rekam 2 menit bicara topik minggu ini, dengar ulang, catat 3 kalimat tersendat",
      ok: !!wk.rec,
      toggle: () => toggleWk("rec"),
    },
    {
      // Ticks itself once the Main peran sessions of this level + week add
      // up to 10 minutes. The manual tick (the old "gpt" key, so earlier
      // weeks keep their state) stays as a fallback.
      name: "Main peran 10 menit",
      ok: rpMinutes >= 10 || !!wk.gpt,
      val:
        rpMinutes >= 10
          ? `${rpMinutes} menit · otomatis`
          : rpMinutes
            ? `${rpMinutes} / 10 menit`
            : "belum dicoba",
      go: () => router.push("/scenario"),
      toggle: () => toggleWk("gpt"),
    },
  ];
  const passed = checks.every((c) => c.ok);
  const phase =
    level === "beginner"
      ? "Cadangan · Pemula"
      : level === "pre"
        ? week <= 4
          ? "Fase A · Fondasi bicara"
          : week <= 8
            ? "Fase B · Travel, kerja, presentasi"
            : "Fase C · Diskusi dan cerita"
        : level === "inter"
          ? "Fase D · Intermediate"
          : "Fase E · Upper";

  const dayName = sat
    ? "Sabtu · checkpoint"
    : sun
      ? "Minggu · ringan"
      : ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][dow];
  const nowId = blocks.find((b) => !day[b.id])?.id;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-[760px] min-w-0 flex-col gap-1.5">
          <SectionLabel>
            {phase} · Minggu {week} · {dayName}
          </SectionLabel>
          <h2 className="m-0 text-2xl leading-[30px] font-black tracking-[-0.02em] text-ink md:text-[30px] md:leading-9">
            40 menit, tiga blok, urutan tetap.
          </h2>
          <span className="text-sm font-bold text-ink-2">
            {CHEERS[(week - 1) % CHEERS.length]}
          </span>
          <Lead>
            Rutinitasnya sama setiap hari supaya tidak ada energi terbuang untuk
            memutuskan &quot;belajar apa sekarang&quot;. Yang berubah hanya
            isinya: minggu dan rumus. Akhir pekan cukup blok 1. Blok tercentang
            sendiri begitu aktivitasnya selesai.
          </Lead>
        </div>
        <div className="flex items-center gap-2">
          <Stat>
            Hari ini{" "}
            <b className="text-ink tabular-nums">
              {doneN}/{blocks.length}
            </b>
          </Stat>
          <Stat>
            Streak <b className="text-ink tabular-nums">{streak}</b> hari
          </Stat>
          <Menu
            label="Menu rencana"
            button={(p) => (
              <IconButton aria-label="Menu rencana" title="Menu rencana" {...p}>
                <LuEllipsis aria-hidden size={18} />
              </IconButton>
            )}
          >
            <Menu.Item
              tone="bad"
              onSelect={() =>
                void confirmDialog({
                  title: "Reset rencana?",
                  message:
                    "Semua catatan rencana (checklist, streak, riwayat tes) akan dihapus.",
                  confirmLabel: "Reset",
                  tone: "danger",
                }).then((ok) => ok && usePlanStore.getState().reset())
              }
            >
              Reset rencana
            </Menu.Item>
          </Menu>
        </div>
      </div>

      {allDone && (
        <Card tone="greenBg" className="flex-row items-center gap-4">
          <Jalak mood="bangga" />
          <span className="text-[15px] leading-[22px] font-bold text-ink">
            ✓ Hari ini selesai. Besok blok yang sama; kalau Sabtu, kerjakan
            checkpoint di bawah.
          </span>
        </Card>
      )}

      <div className="grid items-start gap-5 @min-[56rem]:grid-cols-[minmax(0,1fr)_340px]">
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {blocks.map((b) => {
            const done = !!day[b.id];
            const state = done ? "done" : b.id === nowId ? "now" : "next";
            return (
              <li key={b.id}>
                <Card
                  tone={
                    state === "done" ? "done" : state === "now" ? "ink" : "line"
                  }
                  className="gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <BlockNo no={b.no} state={state} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-base leading-[22px] font-extrabold text-ink">
                        {b.name} · {b.min}
                      </span>
                      {state !== "now" && (
                        <span className="text-[13.5px] leading-[19px] text-ink-2">
                          {b.desc}
                        </span>
                      )}
                    </div>
                    {state === "done" ? (
                      <span className="shrink-0 text-sm font-extrabold text-ok">
                        Selesai
                      </span>
                    ) : (
                      state === "next" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 max-md:hidden"
                          onClick={() => router.push(b.to)}
                        >
                          Buka {b.go} →
                        </Button>
                      )
                    )}
                  </div>
                  {state === "now" && (
                    <>
                      <span className="text-[15px] leading-[22px] text-ink">
                        {b.desc}
                      </span>
                      <span className="text-[13.5px] leading-[19px] text-ink-2">
                        <b className="font-extrabold text-ink">Kenapa: </b>
                        {b.why}
                      </span>
                      <Button
                        variant="green"
                        className="self-start"
                        onClick={() => router.push(b.to)}
                      >
                        Buka {b.go} →
                      </Button>
                    </>
                  )}
                  {state === "next" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="self-start md:hidden"
                      onClick={() => router.push(b.to)}
                    >
                      Buka {b.go} →
                    </Button>
                  )}
                </Card>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col gap-4">
          <Card className="gap-3">
            <SectionLabel>RUMUS AKTIF (BLOK 3, HARI GANJIL)</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {ASK_RULES.map(([r, l]) => (
                <Pill
                  key={r}
                  size="sm"
                  on={r === rule}
                  onClick={() => setPlan((p) => ({ ...p, rule: r }))}
                >
                  {l}
                </Pill>
              ))}
            </div>
            <span className="text-[13.5px] leading-[19px] text-ink-2">
              Ganti rumus saat checkpoint Bertanya lolos. Urutan: 1 → 2 → 3 → 4,
              lalu ulang semua di tahap ketik.
            </span>
            <span className="border-t-2 border-dashed border-line pt-3 text-[13.5px] leading-[19px] text-ink-2">
              Pelafalan berikutnya (hari genap):{" "}
              <b className="font-extrabold text-ink">{pronName}</b>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => usePlanStore.getState().advancePron()}
            >
              sudah, lanjut bagian berikutnya
            </Button>
          </Card>

          <Card className="gap-3">
            <SectionLabel>
              CHECKPOINT MINGGU {week} · SABTU · SYARAT NAIK MINGGU
            </SectionLabel>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {checks.map((c, i) => (
                <li
                  key={i}
                  className="flex min-h-11 items-center gap-3 text-sm leading-5 font-semibold text-ink"
                >
                  {"toggle" in c ? (
                    <CheckBox on={c.ok} label={c.name} onClick={c.toggle!} />
                  ) : (
                    <span
                      aria-hidden
                      className={classNames(
                        "inline-flex w-7 shrink-0 justify-center text-base font-black",
                        c.ok
                          ? "text-ok"
                          : c.val === "belum dicoba"
                            ? "text-ink-3"
                            : "text-bad",
                      )}
                    >
                      {c.ok ? "✓" : c.val === "belum dicoba" ? "–" : "✕"}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    {"val" in c && (
                      <span className="sr-only">
                        {c.ok ? "Lolos: " : "Belum lolos: "}
                      </span>
                    )}
                    {c.name}
                  </span>
                  {"val" in c && (
                    <TextButton className="shrink-0 text-right" onClick={c.go}>
                      {c.val}
                    </TextButton>
                  )}
                </li>
              ))}
            </ul>
            {passed ? (
              <Card
                tone="greenBg"
                pad="sm"
                className="flex-row items-center gap-3"
              >
                <Jalak mood="bangga" />
                <span className="text-sm font-extrabold text-ink">
                  ✓ Lolos. Naikkan minggu di tab Kosakata.
                </span>
              </Card>
            ) : (
              <span className="text-[13.5px] font-semibold text-ink-2">
                Gagal salah satu → minggu diulang, bukan lanjut.
              </span>
            )}
            <span className="text-[12.5px] leading-[18px] text-ink-2">
              Checkpoint bulanan: tes cepat &quot;Semua minggu&quot; ≥ 16/20 dan
              sesi ChatGPT 10 menit tanpa kata Indonesia. Fase: Pre-intermediate
              minggu 1–12 (A, B, C) → Intermediate (D). Upper hanya bila
              Intermediate tuntas.
            </span>
          </Card>

          <Tests.ExamCard />
        </div>
      </div>
    </section>
  );
});

PlanPage.displayName = "PlanPage";

export default PlanPage;
