// "Progres": a light activity log (progress doc `activity`). Per day only
// counts, so the doc stays small even though it is sent whole.

export type ActivityEventType =
  | "grammar_set"
  | "quick_test"
  | "roleplay"
  | "listening_set"
  | "reading"
  | "exam";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  /** Epoch ms. */
  ts: number;
  durationSec?: number;
  meta?: Record<string, string | number | boolean>;
}

/** One day (UTC epoch day, as today()). */
export interface ActivityDay {
  /** Active seconds per menu. */
  m?: Record<string, number>;
  /** Cards answered in Ulang (words and mistakes). */
  r?: number;
  /** Of those, answered "Ingat". */
  g?: number;
  /** Words marked memorised (net: un-marking counts back). */
  l?: number;
}

export interface ActivityData {
  v: 1;
  /** First day this log recorded (minutes, reviews, words). */
  since: number;
  days: Record<string, ActivityDay>;
  /** Finished sessions of the last 90 days. */
  events: ActivityEvent[];
}
