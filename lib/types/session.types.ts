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
  | "roleplay";

export type LevelId = "beginner" | "pre" | "inter" | "upper";

export type RoleId = "admin" | "learner";

// GET /auth/me and POST /auth/redeem
export interface SessionData {
  label: string;
  role: RoleId;
  menus: MenuId[];
  levels: LevelId[];
  expiresAt: string | null;
}

export interface RedeemPayload {
  token: string;
}
