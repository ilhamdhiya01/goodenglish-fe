export type MenuId =
  | "plan"
  | "vocab"
  | "review"
  | "scenario"
  | "errors"
  | "grammar"
  | "pronunciation";

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
