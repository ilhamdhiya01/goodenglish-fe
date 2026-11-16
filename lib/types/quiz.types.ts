// Sesi "Tes cepat" — state-nya disimpan di quiz store, bukan localStorage.

/** Cakupan soal: minggu aktif saja atau semua minggu di level ini. */
export type QuizScope = "week" | "all";

export interface QuizQ {
  word: string;
  ex: string;
  ans: string;
  prompt: string;
  opts: string[];
}

/** A question answered wrong, listed on the result screen. */
export interface QuizMiss {
  word: string;
  ans: string;
  picked: string;
}

export interface QuizState {
  qs: QuizQ[];
  i: number;
  score: number;
  picked: string | null;
  done: boolean;
  /** Wrong answers so far (kept in memory only, for the result screen). */
  misses?: QuizMiss[];
}
