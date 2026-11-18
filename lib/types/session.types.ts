export type MenuId =
  | "plan"
  | "vocab"
  | "review"
  | "scenario"
  | "errors"
  | "grammar"
  | "pronunciation"
  | "cheatsheet"
  // Not a tab: the floating "Tanya AI" chat.
  | "ai"
  // Not a tab either: "Main peran" (voice roleplay) inside Skenario. Needs
  // "scenario" too.
  | "roleplay"
  // "Menyimak": listening practice (a tab).
  | "listening"
  // "Bacaan": graded reading texts (a tab).
  | "reading";

export type LevelId = "beginner" | "pre" | "inter" | "upper";

export type RoleId = "admin" | "learner";

// GET /auth/me and POST /auth/redeem
export interface SessionData {
  label: string;
  role: RoleId;
  menus: MenuId[];
  levels: LevelId[];
  expiresAt: string | null;
  /** "Wajib lulus ujian untuk naik level". Optional: older backends. */
  requireExam?: boolean;
}

export interface RedeemPayload {
  token: string;
}
