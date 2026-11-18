import type { LevelId, MenuId, RoleId } from "./session.types";

export type TokenStatus = "active" | "revoked" | "expired";

export interface AccessTokenItem {
  id: string;
  label: string;
  tokenPrefix: string;
  role: RoleId;
  menus: MenuId[];
  levels: LevelId[];
  maxDevices: number;
  // Tanya AI questions per day; null = unlimited.
  aiDailyLimit: number | null;
  // Main peran sessions per day; null = unlimited.
  roleplayDailyLimit: number | null;
  // Next level only after passing the exam. Optional: older backends.
  requireExam?: boolean;
  activeDevices: number;
  status: TokenStatus;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreatedToken {
  token: string;
  item: AccessTokenItem;
}

export interface TokenFormValues {
  label: string;
  role: RoleId;
  menus: MenuId[];
  levels: LevelId[];
  maxDevices: number;
  expiresAt: string | null;
  // null = unlimited.
  aiDailyLimit: number | null;
  roleplayDailyLimit: number | null;
  requireExam: boolean;
}

export interface TokenSessionItem {
  id: string;
  deviceLabel: string;
  active: boolean;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

export interface TokenSummary {
  knownCount: number;
  srsCount: number;
  ownSentenceCount: number;
  customWordCount: number;
  // Of customWordCount, saved from Bacaan. Optional: older backends.
  personalWordCount?: number;
  // Bacaan texts finished. Optional: older backends.
  readingDoneCount?: number;
  // "Buku kesalahanku". Optional: older backends.
  mistakeActiveCount?: number;
  mistakeMasteredCount?: number;
  topMistakeCategories?: { id: string; count: number }[];
  // Tes penempatan + ujian akhir level. Optional: older backends.
  placement?: {
    status: "done" | "skipped";
    date: string | null;
    level: string | null;
    week: number | null;
  } | null;
  examAttempts?: {
    level: string;
    date: string;
    pct: number;
    passed: boolean;
    sections: { section: string; right: number; total: number }[];
  }[];
  lastProgressAt: string | null;
  sessions: TokenSessionItem[];
  // Newest week first. Optional: an older backend doesn't send it.
  roleplayWeeks?: RoleplayWeek[];
}

// Main peran activity in one calendar week (Monday–Sunday, WIB).
export interface RoleplayWeek {
  weekStart: string;
  sessions: number;
  minutes: number;
}

// One row of "Ringkasan pelajar" (Admin › Kelola).
export interface LearnerOverview {
  id: string;
  label: string;
  status: TokenStatus;
  levels: LevelId[];
  menus: MenuId[];
  /** Active level in the app, if the learner picked one. */
  level: LevelId | null;
  /** Latest of the last sign-in and the last recorded activity. */
  lastActiveAt: string | null;
  streak: number;
  minutes7d: number;
  wordsThisWeek: number;
  /** % "Ingat" in Ulang over 28 days; null without reviews. */
  retention: number | null;
  reviews28d: number;
}
