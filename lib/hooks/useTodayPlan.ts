import { ASK_RULES } from "@/const/plan.constant";
import { PRON_SECS } from "@/const/pronunciation.constant";
import { today } from "@/lib/helpers/storage.helper";
import { useShellData } from "@/lib/hooks/useShellData";
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
  const { srs, known } = useShellData();
  const P = usePlanStore((s) => s.plan);

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
