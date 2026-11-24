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
  /** An Ulang mistake card, flattened to text (instead of word/meaning/note). */
  mistake?: string;
  /** That card's right sentence, stored with the question. */
  card?: string;
}

/** The word card a question came from. */
export interface AiWord {
  word: string;
  meaning?: string;
  /** Set when it is an Ulang mistake card: the card as text, sent as
   * context.mistake; `word` is then its right sentence. */
  mistake?: string;
}

// GET /ai/usage
export interface AiUsage {
  used: number;
  /** null = unlimited. */
  limit: number | null;
}

// GET /ai/conversations: a saved thread, newest first.
export interface AiConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

// GET /ai/conversations/:id
export interface AiConversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: (AiMessage & { createdAt: string })[];
}

export interface AiMessage {
  id: string;
  role: AiRole;
  text: string;
  /** The word this message was about, shown above it. */
  word?: AiWord;
  /** The Ulang mistake card it was about: that card's right sentence. */
  card?: string;
  /** The reply failed; `text` holds the error to show. */
  error?: boolean;
}
