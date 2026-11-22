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

export interface RetryItem {
  prompt: string;
  hint: string;
  ans: string;
  /** Why the answer was wrong (older entries: why the key is right). */
  why: string;
  /** The learner's whole sentence (missing on older entries). */
  given?: string;
}

export interface RuleStats {
  done: Record<string, 1>;
  seen: number;
  right: number;
  wrong: number;
  /** "Terakhir salah": answered wrong, not yet answered right since. */
  retry?: RetryItem[];
  /** Answers per stage (added later: older stats only have the totals). */
  byStage?: Partial<Record<PracticeStage, { seen: number; right: number }>>;
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
