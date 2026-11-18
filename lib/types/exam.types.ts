import type { PracticeTopic } from "@/const/practice-sets.constant";
import type { DictationSentence } from "@/lib/helpers/listening.helper";
import type { AskQ, PracticeStage } from "@/lib/types/ask-practice.types";
import type {
  ListeningLine,
  ListeningQuestion,
} from "@/lib/types/listening.types";
import type { LevelId } from "@/lib/types/session.types";

// Tes penempatan + ujian akhir level: one test engine, questions taken from
// Kosakata, Panduan grammar practice and Menyimak.

export type SectionId = "vocab" | "grammar" | "listening";

export const SECTION_LABEL: Record<SectionId, string> = {
  vocab: "Kosakata",
  grammar: "Grammar",
  listening: "Menyimak",
};

interface Base {
  id: string;
  level: LevelId;
}

export type TestQuestion =
  | (Base & {
      kind: "vocab-mc" | "vocab-rev";
      section: "vocab";
      /** The English word (mc) or its meaning (rev). */
      prompt: string;
      options: string[];
      answer: string;
      word: string;
      meaning: string;
    })
  | (Base & {
      kind: "vocab-type";
      section: "vocab";
      /** The meaning; the learner types the English word. */
      prompt: string;
      answer: string;
      word: string;
      meaning: string;
    })
  | (Base & {
      kind: "grammar";
      section: "grammar";
      topic: PracticeTopic;
      set: string;
      stage: PracticeStage;
      q: AskQ;
    })
  | (Base & {
      kind: "dictation";
      section: "listening";
      sentence: DictationSentence;
    })
  | (Base & {
      kind: "listen";
      section: "listening";
      title: string;
      dialog: boolean;
      lines: ListeningLine[];
      question: ListeningQuestion;
    });

/** Option text, typed text, built sentence, or option index (listen). */
export type TestAnswer = string | number | null;

export interface SectionScore {
  right: number;
  total: number;
}

export type SectionScores = Partial<Record<SectionId, SectionScore>>;

export interface PlacementResult {
  status: "done" | "skipped";
  /** ISO time. */
  date: string;
  perLevel?: Partial<Record<LevelId, SectionScores>>;
  recommended?: { level: LevelId; week: number };
}

export interface ExamAttempt {
  id: string;
  level: LevelId;
  /** ISO time. */
  date: string;
  sections: SectionScores;
  /** 0–100, all sections together. */
  pct: number;
  passed: boolean;
}

/** Progress doc `exam` (Export/Import v8). */
export interface ExamData {
  placement: PlacementResult | null;
  attempts: ExamAttempt[];
  /** Level the learner started at, for "Wajib lulus ujian". */
  base: LevelId | null;
}
