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
  | "reading"
  // "Progres": the learner's progress charts (a tab).
  | "progress";

export type LevelId = "beginner" | "pre" | "inter" | "upper";

export type RoleId = "admin" | "learner";

// GET /auth/me and POST /auth/redeem
export interface SessionData {
  /** Access token id: owner of progress saves left on this device.
   * Optional: older backends. */
  tokenId?: string;
  label: string;
  role: RoleId;
  menus: MenuId[];
  levels: LevelId[];
  expiresAt: string | null;
  /** "Wajib lulus ujian untuk naik level". Optional: older backends. */
  requireExam?: boolean;
  /** Learning-day time zone (IANA). Optional: older backends → Asia/Jakarta. */
  timeZone?: string;
}

export interface RedeemPayload {
  token: string;
}
