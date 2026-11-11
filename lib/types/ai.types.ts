import type { LevelId } from "@/lib/types/session.types";

// "Tanya AI" (Gemini via the backend). Roles use Gemini's own names.
export type AiRole = "user" | "model";

/** What the learner is looking at — sent with every question. */
export interface AiContext {
  page?: string;
  level?: LevelId;
  week?: number;
  word?: string;
  meaning?: string;
  note?: string;
}

/** The word card a question came from. `cardKey` lets a checked sentence be
 * saved back as that card's "Kalimatku". */
export interface AiWord {
  word: string;
  meaning?: string;
  cardKey?: string;
}

export type CheckVerdict = "correct" | "almost" | "incorrect";

// POST /ai/check
export interface CheckResult {
  verdict: CheckVerdict;
  corrected: string;
  explanation: string;
  alternatives: string[];
  /** Misspelled words. Optional: checks saved before typos existed lack it. */
  typos?: { wrong: string; correct: string }[];
}

// GET /ai/usage
export interface AiUsage {
  used: number;
  /** null = unlimited. */
  limit: number | null;
}

export interface AiMessage {
  id: string;
  role: AiRole;
  text: string;
  /** Set on the model's reply to a sentence check. */
  check?: CheckResult;
  /** The word this message was about, shown as a chip. */
  word?: AiWord;
  /** A learner's sentence sent to "Cek kalimat" rather than a question. */
  isCheck?: boolean;
  /** The reply failed; `text` holds the error to show. */
  error?: boolean;
}
