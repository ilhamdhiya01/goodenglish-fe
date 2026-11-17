import type { LevelId } from "@/lib/types/session.types";

// "Bacaan" (graded reading). Texts come from goodenglish-be reading.

export type ReadingSlot = "A" | "B";

/** Word range per slot (product spec). */
export const SLOT_WORDS: Record<ReadingSlot, [number, number]> = {
  A: [150, 200],
  B: [200, 300],
};

export interface ReadingParagraph {
  en: string;
  id: string;
}

export interface GlossaryEntry {
  word: string;
  meaningId: string;
}

export type ReadingQuestion =
  | {
      type: "mcq";
      question: string;
      options: string[];
      answerIndex: number;
      explanationId: string;
    }
  | {
      type: "true_false";
      statement: string;
      answer: boolean;
      explanationId: string;
    }
  | { type: "find_word"; promptId: string; answer: string };

/** Content rules a draft misses (computed by the backend). */
export type ReadingWarning =
  | { code: "word_count"; count: number; min: number; max: number }
  | { code: "few_target_words"; found: number; min: number }
  | { code: "targets_not_in_text"; words: string[] }
  | { code: "find_word_not_in_text"; word: string };

export interface ReadingText {
  id: string;
  level: LevelId;
  week: number;
  slot: ReadingSlot;
  status: "draft" | "published";
  title: string;
  paragraphs: ReadingParagraph[];
  targetWordsUsed: string[];
  glossary: GlossaryEntry[];
  questions: ReadingQuestion[];
  wordCount: number;
  warnings: ReadingWarning[];
  createdBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateReadingBody {
  level: LevelId;
  week: number;
  slot: ReadingSlot;
  words: string[];
  tense?: { name: string; use?: string };
}

/** Admin edit; `words` = the week's Kosakata, to recount the warnings. */
export interface UpdateReadingBody {
  title?: string;
  paragraphs?: ReadingParagraph[];
  targetWordsUsed?: string[];
  glossary?: GlossaryEntry[];
  questions?: ReadingQuestion[];
  words?: string[];
}

export interface WordMeaning {
  lemma: string;
  meaningId: string;
  pron: string;
}

export interface LookupResult extends WordMeaning {
  word: string;
  cached: boolean;
}

/** One finished text (quiz answered). */
export interface ReadingResult {
  id: string;
  /** ISO date-time. */
  date: string;
  textId: string;
  title: string;
  level: LevelId;
  week: number;
  score: number;
  total: number;
  /** Words saved to Ulang while reading. */
  savedWords: number;
}

/** Progress doc `reading` (Export/Import v6). */
export interface ReadingData {
  results: ReadingResult[];
  /** textId → ISO date first finished. */
  done: Record<string, string>;
  /** "level|word" → meaning from /reading/lookup (local cache). */
  lookups: Record<string, WordMeaning>;
}
