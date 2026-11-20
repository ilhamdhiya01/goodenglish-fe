import { default as AdminShell } from "./AdminShell";
import { default as AiSettingsCard } from "./AiSettingsCard";
import { default as LearnerOverview } from "./LearnerOverview";
import { default as ListeningManager } from "./ListeningManager";
import { default as PetaMingguManager } from "./PetaMingguManager";
import { default as ReadingManager } from "./ReadingManager";
import { default as TokenManager } from "./TokenManager";
import { default as WordManager } from "./WordManager";
import { default as WordMeaningManager } from "./WordMeaningManager";

export const Admin = {
  AdminShell,
  AiSettingsCard,
  LearnerOverview,
  ListeningManager,
  PetaMingguManager,
  ReadingManager,
  TokenManager,
  WordManager,
  WordMeaningManager,
} as const;
