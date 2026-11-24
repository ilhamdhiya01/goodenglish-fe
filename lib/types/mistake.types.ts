import type { LevelId } from "@/lib/types/session.types";

// "Buku kesalahanku": the learner's own mistakes (progress doc `mistakes`).

export type MistakeSource =
  | "Grammar"
  | "Kuis Kesalahan umum"
  | "Kalimatku"
  | "Tanya AI"
  | "Main peran"
  | "Dikte"
  | "Ujian";

export const MISTAKE_SOURCES: MistakeSource[] = [
  "Grammar",
  "Kuis Kesalahan umum",
  "Kalimatku",
  "Tanya AI",
  "Main peran",
  "Dikte",
  "Ujian",
];

export type MistakeStatus = "active" | "mastered" | "archived";

/** Review schedule of a mistake card (same steps as word cards). */
export interface MistakeSrs {
  /** Index into GAPS. */
  st: number;
  /** Epoch day it is due. */
  due: number;
  /** "Ingat" answers in a row. */
  streak: number;
  /** Days of the last scheduled gap. */
  lastGap: number;
  /** Times answered in Ulang (0 = a new card). */
  reps: number;
}

/** What a feature hands to addMistake (field names from the product spec). */
export interface MistakeInput {
  source: MistakeSource;
  wrong: string;
  correct: string;
  explanation_id: string;
  category: string;
  /** The Cheat sheet rule it breaks (lib/helpers/cheat-rules.helper.ts),
   * when known; "Lihat aturannya" then shows that rule, not the section. */
  rule?: string;
  level: LevelId;
  refId?: string;
  /** Ujian: the Indonesian sentence the question asked for (shown on the
   * card before answering). Own sentences have none. */
  meaning?: string;
}

export interface MistakeRecord extends MistakeInput {
  id: string;
  /** Pattern: normalised wrong → correct. The same pattern is one record. */
  key: string;
  /** ISO time first seen. */
  createdAt: string;
  /** ISO time last seen (or last changed). */
  lastAt: string;
  /** How many times it happened. */
  count: number;
  status: MistakeStatus;
  srs: MistakeSrs;
  /** Ulang: the learner's last answer to this card while it is still not
   * right; the card shows it instead of `wrong`. */
  lastTry?: string;
}

export interface MistakeData {
  v: 2;
  items: MistakeRecord[];
  /** "Sertakan kartu kesalahan" in Ulang. */
  reviewOn: boolean;
  /** New mistake cards answered for the first time today. */
  intro: { day: number; n: number };
}
