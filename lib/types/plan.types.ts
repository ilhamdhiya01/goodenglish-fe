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
}

export interface PlanData {
  days?: Record<string, Record<string, boolean>>;
  week?: Record<string, Partial<Record<"rec" | "gpt", boolean>>>;
  quiz?: PlanQuizEntry[];
  rule?: string;
  pronIdx?: number;
}
