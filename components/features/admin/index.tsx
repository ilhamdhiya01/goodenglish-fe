import { default as AdminShell } from "./AdminShell";
import { default as AiSettingsCard } from "./AiSettingsCard";
import { default as ListeningManager } from "./ListeningManager";
import { default as TokenManager } from "./TokenManager";
import { default as WordManager } from "./WordManager";

export const Admin = {
  AdminShell,
  AiSettingsCard,
  ListeningManager,
  TokenManager,
  WordManager,
} as const;
