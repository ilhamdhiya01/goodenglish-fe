"use client";

import classNames from "classnames";
import { useRouter } from "next/navigation";
import React from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import TextButton from "@/components/ui/text-button";
import { ASK_RULES, CHEERS } from "@/const/plan.constant";
import { useShellData } from "@/lib/hooks/useShellData";
import { useTodayPlan } from "@/lib/hooks/useTodayPlan";
import { useAskPracticeStore } from "@/stores/useAskPracticeStore";
import { usePlanStore } from "@/stores/usePlanStore";

const Check = ({
  on,
  onClick,
  size = 26,
}: {
  on: boolean;
  onClick?: () => void;
  size?: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={classNames(
      "inline-flex flex-none items-center justify-center rounded-[7px] border-[1.5px] text-card",
      on ? "border-green bg-green" : "border-faint bg-transparent",
      onClick ? "cursor-pointer" : "cursor-default",
    )}
    style={{ width: size, height: size }}
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  </button>
);

// Halaman Rencana: rutinitas harian 3 blok (dicentang otomatis oleh
// PlanAutoCheck) + checkpoint mingguan.
const PlanPage = React.memo(() => {
  const { level, week } = useShellData();
  const P = usePlanStore((s) => s.plan);
  const setPlan = usePlanStore((s) => s.setPlan);
  const askPrac = useAskPracticeStore((s) => s.stats);
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
  const bestWeek = weekQuiz.reduce((m, q) => Math.max(m, q.score), 0);
  const ap = askPrac[rule] || { seen: 0, right: 0 };
  const askAcc = ap.seen >= 20 ? Math.round((ap.right / ap.seen) * 100) : null;
  const wkKey = level + "|" + week;
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
      name: 'Tes cepat "Minggu ini" ≥ 16 / 20',
      ok: bestWeek >= 16,
      val: weekQuiz.length ? `terbaik ${bestWeek} / 20` : "belum dicoba",
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
      name: "Sesi ChatGPT voice 10 menit tanpa satu pun kata Indonesia",
      ok: !!wk.gpt,
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

  return (
    <section className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div className="flex max-w-[760px] flex-col gap-1.5">
          <SectionLabel tone="green">
            {phase} · Minggu {week} ·{" "}
            {sat
              ? "Sabtu · checkpoint"
              : sun
                ? "Minggu · ringan"
                : [
                    "Minggu",
                    "Senin",
                    "Selasa",
                    "Rabu",
                    "Kamis",
                    "Jumat",
                    "Sabtu",
                  ][dow]}
          </SectionLabel>
          <h2 className="m-0 text-3xl leading-[1.15] font-bold tracking-[-0.02em]">
            40 menit, tiga blok, urutan tetap.
          </h2>
          <span className="text-sm font-bold text-ink-2">
            {CHEERS[(week - 1) % CHEERS.length]}
          </span>
          <p className="m-0 text-[15px] leading-[1.55] text-pretty text-ink-2">
            Rutinitasnya sama setiap hari supaya tidak ada energi terbuang untuk
            memutuskan &quot;belajar apa sekarang&quot;. Yang berubah hanya
            isinya: minggu dan rumus. Akhir pekan cukup blok 1. Blok tercentang
            sendiri begitu aktivitasnya selesai.
          </p>
        </div>
        <div className="flex items-baseline gap-4.5 font-mono text-[12.5px] text-muted">
          <span>
            hari ini <b className="text-lg text-ink">{doneN}</b> /{" "}
            {blocks.length}
          </span>
          <span>
            streak <b className="text-lg text-green">{streak}</b> hari
          </span>
          <TextButton
            onClick={() => {
              if (
                window.confirm(
                  "Hapus semua catatan rencana (checklist, streak, riwayat tes)?",
                )
              )
                usePlanStore.getState().reset();
            }}
          >
            reset
          </TextButton>
        </div>
      </div>

      {allDone && (
        <div className="rounded-[10px] border border-green-line bg-green-bg px-4 py-3 text-[14.5px] font-semibold text-green-deep">
          Hari ini selesai. Besok blok yang sama; kalau Sabtu, kerjakan
          checkpoint di bawah.
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
        {blocks.map((b) => {
          const done = !!day[b.id];
          return (
            <div
              key={b.id}
              className={classNames(
                "flex flex-col gap-2.5 rounded-xl border-[1.5px] px-[18px] py-4",
                done ? "border-green bg-green-bg" : "border-line bg-card",
              )}
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-baseline gap-2.5">
                  <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-green font-mono text-[13px] font-bold text-card">
                    {b.no}
                  </span>
                  <span className="text-[19px] font-bold">{b.name}</span>
                  <span className="font-mono text-xs text-muted">{b.min}</span>
                </div>
                <Check on={done} />
              </div>
              <span className="text-sm leading-[1.5] text-pretty text-ink-2">
                {b.desc}
              </span>
              <span className="text-[12.5px] leading-[1.45] text-muted italic">
                {b.why}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="mt-auto self-start"
                onClick={() => router.push(b.to)}
              >
                Buka {b.go} →
              </Button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
        <Card tone="line" className="gap-2.5 rounded-xl px-[18px] py-4">
          <SectionLabel>RUMUS AKTIF (BLOK 3, HARI GANJIL)</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {ASK_RULES.map(([r, l]) => (
              <button
                type="button"
                key={r}
                onClick={() => setPlan((p) => ({ ...p, rule: r }))}
                className={classNames(
                  "inline-flex h-8 cursor-pointer items-center rounded-full border-[1.5px] border-ink px-3 font-sans text-[13px] font-semibold",
                  r === rule ? "bg-ink text-paper" : "bg-card text-ink",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <span className="text-[13px] leading-[1.5] text-ink-3">
            Ganti rumus saat checkpoint Bertanya lolos. Urutan: 1 → 2 → 3 → 4,
            lalu ulang semua di tahap ketik.
          </span>
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-dashed border-line pt-2.5">
            <span className="text-[13px] text-ink-3">
              Pelafalan berikutnya (hari genap): <b>{pronName}</b>
            </span>
            <TextButton
              tone="green"
              onClick={() => usePlanStore.getState().advancePron()}
            >
              sudah, lanjut bagian berikutnya
            </TextButton>
          </div>
        </Card>
      </div>

      <Card tone="ink" pad="lg" className="gap-3 rounded-xl">
        <div className="flex flex-wrap items-baseline justify-between gap-2.5">
          <SectionLabel tone="green">
            CHECKPOINT MINGGU {week} · SABTU · SYARAT NAIK MINGGU
          </SectionLabel>
          {passed ? (
            <span className="text-[13px] font-bold text-green">
              Lolos. Naikkan minggu di tab Kosakata.
            </span>
          ) : (
            <span className="text-[13px] text-muted">
              Gagal salah satu → minggu diulang, bukan lanjut.
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {checks.map((c, i) => (
            <div
              key={i}
              className={classNames(
                "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[9px] border px-3.5 py-[11px]",
                c.ok ? "border-green bg-green-bg" : "border-line bg-card",
              )}
            >
              <Check
                on={c.ok}
                onClick={"toggle" in c ? c.toggle : undefined}
                size={24}
              />
              <span className="text-[14.5px] leading-[1.4]">{c.name}</span>
              {"val" in c && (
                <TextButton
                  className="font-mono text-xs whitespace-nowrap"
                  onClick={c.go}
                >
                  {c.val}
                </TextButton>
              )}
            </div>
          ))}
        </div>
        <span className="text-[12.5px] leading-[1.5] text-muted">
          Checkpoint bulanan: tes cepat &quot;Semua minggu&quot; ≥ 16/20 dan
          sesi ChatGPT 10 menit tanpa kata Indonesia. Fase: Pre-intermediate
          minggu 1–12 (A, B, C) → Intermediate (D). Upper hanya bila
          Intermediate tuntas.
        </span>
      </Card>
    </section>
  );
});

PlanPage.displayName = "PlanPage";

export default PlanPage;
