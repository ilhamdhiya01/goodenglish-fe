// Rencana belajar harian — dipersist ke localStorage (kunci vocab-plan-v1).
// Semua field opsional karena data lama bisa kosong atau versi sebelumnya.

import type { QuizScope } from "@/lib/types/quiz.types";

export interface PlanQuizEntry {
  /** Hari epoch (Date.now() / 86400000) — dipakai buat dedupe & urutkan riwayat. */
  d: number;
  score: number;
  scope: QuizScope;
  level: string;
  week: number;
  /** Number of questions (older entries: 20). */
  total?: number;
}

/** Hitungan aktivitas satu hari — dasar centang otomatis blok 2 & 3. */
export interface PlanTally {
  /** Hari epoch, sama dengan today(). Beda hari → hitungan mulai dari nol. */
  day: number;
  /** Kata yang ditandai hafal hari ini. */
  known?: number;
  /** Soal latihan Bertanya yang dijawab hari ini. */
  ask?: number;
  /** Bagian Pelafalan yang ditandai selesai hari ini ("sudah, lanjut"). */
  pron?: number;
  /** Kartu Ulang (kata + kesalahan) yang dijawab hari ini. */
  rev?: number;
  /** Kuis 5 soal pengganti Ulang (hari tanpa kartu jatuh tempo) selesai. */
  q1?: boolean;
}

export interface PlanData {
  days?: Record<string, Record<string, boolean>>;
  tally?: PlanTally;
  week?: Record<string, Partial<Record<"rec" | "gpt", boolean>>>;
  quiz?: PlanQuizEntry[];
  rule?: string;
  pronIdx?: number;
}
