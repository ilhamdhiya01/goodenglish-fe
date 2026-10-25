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
  lastProgressAt: string | null;
  sessions: TokenSessionItem[];
}
