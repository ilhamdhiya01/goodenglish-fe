// Latihan "Bertanya" (sub-tab grammar/ask) — progres per rumus, dipersist
// ke localStorage dengan kunci askprac.

export type PracticeStage = "mc" | "order" | "type";

export interface AskQ {
  prompt: string;
  hint: string;
  ans: string;
  opts: string[];
  tokens: string[];
  shuffled: { t: string; i: number }[];
  why: string;
  explain?: Record<string, string>;
  promptId?: string;
  ansId?: string;
}

export interface RuleStats {
  done: Record<string, 1>;
  seen: number;
  right: number;
  wrong: number;
  retry?: { prompt: string; hint: string; ans: string; why: string }[];
}

/** Sesi latihan 20 soal yang sedang berjalan. */
export interface PracticeSession {
  stage: PracticeStage;
  qs: AskQ[];
  i: number;
  picked: string | null;
  ok: boolean;
  typed: string;
  built: { t: string; i: number }[];
  score: number;
  finished: boolean;
}
