import type { LevelId } from "@/lib/types/session.types";

// GET /words, POST/PATCH /admin/words — kosakata bersama buatan admin.
export interface SharedWord {
  id: string;
  level: LevelId;
  week: number;
  type: string;
  en: string;
  meaning: string;
  pron: string;
  example: string;
  createdAt: string;
  updatedAt: string;
}

export type SharedWordInput = Pick<
  SharedWord,
  "level" | "week" | "type" | "en" | "meaning" | "pron" | "example"
>;
