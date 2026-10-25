// Domain kosakata.

/** [type, en, pron, id, ex, syn, mineKey?] — baris kata mentah dari paket data. */
export type Item = [string, string, string, string, string, string, string?];

export interface Tense {
  name: string;
  use: string;
  form: [string, string][];
  markers: string;
  ex: string[];
  tip: string;
}

export interface Week {
  week: number;
  title: string;
  topic: string;
  tense: Tense | null;
  conj?: string[];
  items: Item[];
}

/** [minggu, judul, fokus tense, kata sambung] — baris rencana per level. */
export type PlanRow = [number, string, string, string];

/** Kata buatan pengguna ("Kataku"). */
export interface CustomWord {
  key: string;
  level: string;
  week: number;
  type: string;
  en: string;
  id: string;
  pron: string;
  ex: string;
  syn?: string;
}

/** State form tambah/ubah Kataku. */
export interface FormState {
  editKey?: string;
  en: string;
  id: string;
  pron: string;
  ex: string;
  type: string;
  week: number;
}

/** Penjelasan detail per kata (dari data/raw/notes-*.js). */
export interface WordNote {
  core: string;
  forms?: [string, string][];
  use?: [string, string][];
  traps?: [string, string, string?][];
  see?: string[];
}

/** Frasa kunci & variasi jawaban per skenario. */
export interface ScenKey {
  phrases: [string, string, string][];
  variants: [string, string][];
}
