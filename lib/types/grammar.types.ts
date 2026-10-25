// Panduan grammar: daftar sub-tab + bentuk materi "dibedah" di const/grammar.ts.

export type GrammarSub =
  | "istilah"
  | "tense"
  | "bedo"
  | "thit"
  | "been"
  | "ask"
  | "prep"
  | "conj"
  | "irr"
  | "num";

/** Urutan sub-tab di halaman Grammar; id-nya jadi segmen URL /grammar/:sub. */
export const GRAMMAR_SUBS: { id: GrammarSub; label: string }[] = [
  { id: "istilah", label: "Istilah (S, V1…)" },
  { id: "tense", label: "Memilih tense" },
  { id: "bedo", label: "Kata bantu" },
  { id: "thit", label: "This / It" },
  { id: "been", label: "Was / Have / Been" },
  { id: "ask", label: "Bertanya" },
  { id: "prep", label: "In / On / At" },
  { id: "conj", label: "Kata sambung" },
  { id: "irr", label: "Kata kerja tak beraturan" },
  { id: "num", label: "Angka" },
];

export interface DetailStep {
  t: string;
  b: string;
  ex: [string, string][];
}

export interface Detail {
  label: string;
  title: string;
  idea: string;
  steps: DetailStep[];
  traps: [string, string, string][];
  summary: string;
  drill: [string, string, string?][];
}
