"use client";

import classNames from "classnames";
import { useRouter } from "next/navigation";
import React from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import TextButton from "@/components/ui/text-button";
import { ASK_RULES } from "@/const/plan.constant";
import { PRON_SECS } from "@/const/pronunciation.constant";
import { today } from "@/lib/helpers/storage.helper";
import { useShellData } from "@/lib/hooks/useShellData";
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
  const { level, week, srs, known } = useShellData();
  const P = usePlanStore((s) => s.plan);
  const setPlan = usePlanStore((s) => s.setPlan);
  const askPrac = useAskPracticeStore((s) => s.stats);
  const router = useRouter();

  const T = today();
  const key = String(T);
  const day = P.days?.[key] || {};
  const dow = new Date().getDay();
  const sat = dow === 6;
  const sun = dow === 0;
  const wknd = sat || sun;
  const odd = T % 2 === 1;
  const dueCount = Object.keys(srs).filter(
    (k) => srs[k].due <= T && known[k],
  ).length;
  const rule = P.rule || "r1";
  const ruleNo = ASK_RULES.find((r) => r[0] === rule)![1];
  const pronIdx = (P.pronIdx || 0) % PRON_SECS.length;
  const pronName = PRON_SECS[pronIdx][1];

  interface Block {
    id: string;
    no: string;
    name: string;
    min: string;
    to: string;
    go: string;
    desc: string;
    why: string;
  }
  const blocks: Block[] = (
    [
      {
        id: "b1",
        no: "1",
        name: "Ulang",
        min: "10 mnt",
        to: "/review",
        go: "Ulang hari ini",
        desc: dueCount
          ? `${dueCount} kata jatuh tempo. Jawab dengan suara, bukan dalam hati.`
          : "Tidak ada yang jatuh tempo. Buka Kosakata dan ucapkan 10 kata yang sudah hafal.",
        why: "Kata yang pernah diucapkan lebih cepat keluar saat bicara.",
      },
      wknd
        ? null
        : {
            id: "b2",
            no: "2",
            name: "Masuk",
            min: "15 mnt",
            to: "/vocab",
            go: "Kosakata",
            desc: "10–12 kata baru di minggu aktif. Dengar, ulangi 2×, baca contohnya keras, tulis Kalimatku lalu ucapkan.",
            why: "Tandai hafal hanya yang sudah kamu pakai dalam kalimat sendiri.",
          },
      wknd
        ? null
        : odd
          ? {
              id: "b3",
              no: "3",
              name: "Bentuk",
              min: "15 mnt",
              to: "/grammar/ask",
              go: "Grammar › Bertanya · " + ruleNo,
              desc: `Satu set 20 soal ${ruleNo}. Naik tahap saat ≥ 16/20 dua kali berturut.`,
              why: 'Menyerang "tahu katanya tapi susunan kacau".',
            }
          : {
              id: "b3",
              no: "3",
              name: "Bentuk",
              min: "15 mnt",
              to: "/pronunciation",
              go: "Pelafalan · " + pronName,
              desc: `Shadowing bagian "${pronName}" 10 menit, lalu Panduan grammar › Kata bantu "Satu kalimat, enam tense" 5 menit. Selesai? Klik "sudah, lanjut bagian berikutnya" di bawah.`,
              why: 'Menyerang pelafalan dan "tidak paham ucapan cepat".',
            },
    ] as (Block | null)[]
  ).filter((b): b is Block => !!b);

  const doneN = blocks.filter((b) => !!day[b.id]).length;
  const allDone = doneN === blocks.length;
  let streak = 0;
  for (let d = T - (allDone ? 0 : 1); d > T - 400; d--) {
    const dd = P.days?.[String(d)];
    const n = dd ? Object.values(dd).filter(Boolean).length : 0;
    const wd = new Date(d * 86400000).getDay();
    if (n >= (wd === 0 || wd === 6 ? 1 : 3)) streak++;
    else break;
  }
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
