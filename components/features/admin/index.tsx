import { default as AdminShell } from "./AdminShell";
import { default as AiSettingsCard } from "./AiSettingsCard";
import { default as TokenManager } from "./TokenManager";
import { default as WordManager } from "./WordManager";

export const Admin = {
  AdminShell,
  AiSettingsCard,
  TokenManager,
  WordManager,
} as const;
