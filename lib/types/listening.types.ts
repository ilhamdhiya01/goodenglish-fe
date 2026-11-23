import type { LevelId } from "@/lib/types/session.types";

// "Menyimak" (listening practice).

export type ListeningTab = "dikte" | "dengar" | "bunyi";

export const LISTENING_TABS: { id: ListeningTab; label: string }[] = [
  { id: "dikte", label: "Dikte" },
  { id: "dengar", label: "Dengar & jawab" },
  { id: "bunyi", label: "Bunyi mirip" },
];

export interface ListeningLine {
  speaker: "A" | "B";
  text: string;
}

export interface ListeningQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanationId: string;
}

/** A "Dengar & jawab" item from the shared bank (goodenglish-be listening). */
export interface ListeningItem {
  id: string;
  level: LevelId;
  week: number;
  status: "draft" | "published";
  type: "dialog" | "monolog";
  title: string;
  lines: ListeningLine[];
  questions: ListeningQuestion[];
  wordCount: number;
  createdBy: string | null;
  publishedAt: string | null;
  /** Menyimak harian (made by the server, week 0): its WIB day, YYYY-MM-DD.
   * null for the weekly items. */
  day: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One finished set, kept for the Progres page. */
export interface ListeningResult {
  id: string;
  /** ISO time. */
  date: string;
  tab: ListeningTab;
  stage: number;
  /** Accuracy as score / total: words right for Dikte, answers right otherwise. */
  score: number;
  total: number;
  /** Number of questions in the set (10 sentences, 3–6 questions, 20 pairs). */
  questions: number;
  level: string;
  week: number;
  /** Dictation: how many times sentences were replayed. */
  replays?: number;
}

/** Progress doc `listening`. */
export interface ListeningData {
  results: ListeningResult[];
  /** Highest unlocked stage per tab (1 when missing). */
  stages: Partial<Record<ListeningTab, number>>;
  /** Sentence / item ids already done (unseen ones come first). */
  seen: Record<string, 1>;
  /** Minimal-pair stats per pair id. */
  pairs: Record<string, { right: number; total: number }>;
}

export interface GenerateListeningBody {
  level: LevelId;
  week: number;
  count: number;
  type: "dialog" | "monolog" | "mixed";
  words: string[];
  tense?: { name: string; use?: string };
}

export interface UpdateListeningBody {
  title?: string;
  type?: "dialog" | "monolog";
  week?: number;
  lines?: ListeningLine[];
  questions?: ListeningQuestion[];
}
