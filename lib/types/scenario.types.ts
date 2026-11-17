// Skenario percakapan & daftar kesalahan umum.

import type { ScenarioRoleplay } from "@/lib/types/roleplay.types";

export interface Scenario {
  id: string;
  level: string;
  title: string;
  where: string;
  lines: [string, string, string][];
  /** Data "Main peran" (lib/content/roleplay.ts). */
  roleplay?: ScenarioRoleplay;
}

export interface ErrorGroup {
  cat: string;
  lv: string;
  items: [string, string, string][];
}
