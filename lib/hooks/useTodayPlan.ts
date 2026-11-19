import { ASK_RULES } from "@/const/plan.constant";
import { PRON_SECS } from "@/const/pronunciation.constant";
import { tallyOf } from "@/lib/helpers/plan-check.helper";
import { isWeekend, streakOf } from "@/lib/helpers/streak.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import { useToday } from "@/lib/hooks/useToday";
import { usePlanStore } from "@/stores/usePlanStore";

// The daily routine of the Rencana page — three blocks on weekdays, one at
// the weekend — with today's progress and the streak. Shared with the
// "Hari ini" line the shell shows on every other page.

export interface Block {
  id: string;
  no: string;
  name: string;
  min: string;
  to: string;
  go: string;
  desc: string;
  why: string;
}

export const useTodayPlan = () => {
  const { dueKeys, dueMistakes } = useShellData();
  const P = usePlanStore((s) => s.plan);

  const T = useToday();
  const key = String(T);
  const day = P.days?.[key] || {};
  // Weekday of the learning day (token time zone), the same one the streak
  // uses — not the device clock.
  const dow = new Date(T * 86400000).getUTCDay();
  const sat = dow === 6;
  const sun = dow === 0;
  const wknd = isWeekend(T);
  const t = tallyOf(P.tally, T);
  const odd = T % 2 === 1;
  // Same count as the shell (only cards that still exist).
  const dueCount = dueKeys.length;
  const rule = P.rule || "r1";
  const ruleNo = ASK_RULES.find((r) => r[0] === rule)![1];
  const pronIdx = (P.pronIdx || 0) % PRON_SECS.length;
  const pronName = PRON_SECS[pronIdx][1];

  const blocks: Block[] = (
    [
      {
        id: "b1",
        no: "1",
        name: "Ulang",
        min: "10 mnt",
        to: "/review",
        go: "Ulang hari ini",
        desc:
          dueCount + dueMistakes.length
            ? [
                dueCount && `${dueCount} kata`,
                dueMistakes.length && `${dueMistakes.length} kesalahan`,
              ]
                .filter(Boolean)
                .join(" + ") +
              " jatuh tempo. Jawab dengan suara, bukan dalam hati."
            : t.rev
              ? "Kartu hari ini sudah habis."
              : "Tidak ada kartu jatuh tempo. Kerjakan kuis 5 soal dari Buku kesalahanku di halaman Ulang.",
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
  const streak = streakOf(P.days, T);

  return {
    T,
    key,
    day,
    dow,
    sat,
    sun,
    wknd,
    rule,
    ruleNo,
    pronName,
    dueCount,
    blocks,
    doneN,
    allDone,
    streak,
  };
};
