import type { LevelId } from "@/lib/types/session.types";

// "Main peran": voice roleplay with the AI inside Skenario.

/** Static roleplay data of one scenario (lib/content/roleplay.ts). */
export interface ScenarioRoleplay {
  /** The AI's role, e.g. "cafe cashier". */
  roleAi: string;
  /** The learner's role. */
  roleUser: string;
  /** What the learner must achieve, in English (sent to the AI). */
  mission: string;
  /** The same in Indonesian, for the setup screen. */
  missionId: string;
  /** 2–4 steps, ticked automatically during the session. English for the
   * AI, Indonesian for the learner. */
  steps: { en: string; id: string }[];
}

export type RoleplayRole = "ai" | "user";

export interface RoleplayLine {
  role: RoleplayRole;
  text: string;
}

export interface RoleplayCorrection {
  original: string;
  corrected: string;
  explanation: string;
  /** Cheat sheet section id (const/cheatsheet.constant.ts). */
  category: string;
}

export interface RoleplaySummary {
  missionComplete: boolean;
  /** 1–2 encouraging sentences in Indonesian. */
  summary: string;
  corrections: RoleplayCorrection[];
  moreNatural: { original: string; natural: string }[];
  keyPhrasesUsed: string[];
  durationSec: number;
  userTurns: number;
  stepsDone: number[];
}

/** One finished session in the learner's history (progress doc `roleplay`). */
export interface RoleplayRecord {
  /** Server session id. */
  id: string;
  scenarioId: string;
  /** Learner level and curriculum week when it was played; the weekly
   * checkpoint in Rencana adds up minutes per level|week. */
  level: LevelId;
  week: number;
  /** ISO time. */
  startedAt: string;
  durationSec: number;
  userTurns: number;
  missionComplete: boolean;
  stepsDone: number[];
  transcript: RoleplayLine[];
  summary: RoleplaySummary;
}

export type { MistakeRecord } from "@/lib/types/mistake.types";

// API (goodenglish-be src/modules/roleplay)

export interface RoleplayContext {
  level: LevelId;
  title: string;
  where?: string;
  roleAi: string;
  roleUser: string;
  mission: string;
  steps: string[];
  phrases: string[];
}

export interface RoleplayUsage {
  used: number;
  /** null = unlimited. */
  limit: number | null;
}

export interface RoleplayStarted {
  id: string;
  reply: string;
  remaining: number | null;
}

export interface RoleplayTurn {
  reply: string;
  stepsDone: number[];
  missionComplete: boolean;
  userTurns: number;
  turnsLeft: number;
}

export interface RoleplayHelp {
  suggestions: { en: string; id: string }[];
  helpLeft: number;
}
