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

/** The word card a question came from. */
export interface AiWord {
  word: string;
  meaning?: string;
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
  /** The word this message was about, shown as a chip. */
  word?: AiWord;
  /** The reply failed; `text` holds the error to show. */
  error?: boolean;
}
