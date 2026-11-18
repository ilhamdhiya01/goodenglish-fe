import type { PracticeTopic } from "@/const/practice-sets.constant";
import type { GrammarSub } from "@/lib/types/grammar.types";

// "Buku kesalahanku": one fixed list of mistake categories, each with where
// to learn the rule (a Cheat sheet section and/or a Panduan grammar tab).
// Shared with goodenglish-be src/common/mistake-categories.ts — keep the ids
// in sync. Most ids are Cheat sheet section ids (Main peran saves those).

export interface MistakeCategory {
  id: string;
  label: string;
  /** Cheat sheet section id (/cheatsheet#id). */
  cheat?: string;
  grammar?: GrammarSub;
  /** Any other page to learn from. */
  href?: string;
}

export const FALLBACK_CATEGORY = "kesalahan";

export const MISTAKE_CATEGORIES: MistakeCategory[] = [
  { id: "aturan-dasar", label: "Aturan dasar", cheat: "aturan-dasar" },
  { id: "am-is-are", label: "am/is/are", cheat: "am-is-are", grammar: "bedo" },
  { id: "tense", label: "Tense", cheat: "tense", grammar: "tense" },
  {
    id: "sudah-belum",
    label: "Sudah/belum/pernah",
    cheat: "sudah-belum",
    grammar: "been",
  },
  { id: "pasif", label: "Pasif", cheat: "pasif" },
  {
    id: "pertanyaan",
    label: "Pertanyaan",
    cheat: "pertanyaan",
    grammar: "ask",
  },
  { id: "a-an-the", label: "a/an/the", cheat: "a-an-the" },
  { id: "jamak", label: "Jamak & tak terhitung", cheat: "a-an-the" },
  { id: "to-atau-ing", label: "to + V1 / V-ing", cheat: "to-atau-ing" },
  { id: "preposisi", label: "Preposisi", cheat: "preposisi", grammar: "prep" },
  {
    id: "preposisi-lain",
    label: "Preposisi setelah kata kerja",
    cheat: "preposisi-lain",
  },
  {
    id: "kata-tertukar",
    label: "Kata yang sering tertukar",
    cheat: "kata-tertukar",
  },
  { id: "waktu", label: "Waktu & frekuensi", cheat: "waktu" },
  { id: "urutan-kata", label: "Urutan kata", cheat: "urutan-kata" },
  { id: "terjemahan", label: "Terjemahan langsung", cheat: "kesalahan" },
  { id: "kolokasi", label: "Kolokasi & nada", cheat: "kesalahan" },
  { id: "menyimak", label: "Menyimak", href: "/listening/dikte" },
  { id: FALLBACK_CATEGORY, label: "Lainnya", cheat: "kesalahan" },
];

const BY_ID = new Map(MISTAKE_CATEGORIES.map((c) => [c.id, c]));

/** A known category id; old or unknown values fall back to "Lainnya". */
export const categoryId = (v: unknown): string => {
  if (typeof v !== "string") return FALLBACK_CATEGORY;
  const s = v.trim();
  if (BY_ID.has(s)) return s;
  // Dikte saved "Menyimak" before this list existed.
  if (s.toLowerCase() === "menyimak") return "menyimak";
  return FALLBACK_CATEGORY;
};

export const categoryOf = (id: string): MistakeCategory =>
  BY_ID.get(id) ?? BY_ID.get(FALLBACK_CATEGORY)!;

/** Where "Pelajari aturannya" goes: the Cheat sheet section first. */
export const learnHref = (id: string): string => {
  const c = categoryOf(id);
  if (c.cheat) return `/cheatsheet#${c.cheat}`;
  if (c.grammar) return `/grammar/${c.grammar}`;
  return c.href ?? "/cheatsheet";
};

/** Kesalahan umum card groups → category. */
export const ERROR_GROUP_CATEGORY: Record<string, string> = {
  "Lupa kata be": "am-is-are",
  "Lupa -s untuk he/she/it": "aturan-dasar",
  "Artikel a / an / the": "a-an-the",
  "Preposisi setelah kata kerja": "preposisi-lain",
  "Tense yang tertukar": "tense",
  "Terjemahan langsung dari Indonesia": "terjemahan",
  "Terjemahan langsung dari Indonesia (lanjutan)": "terjemahan",
  "Kata yang sering salah pilih": "kata-tertukar",
  "Pertanyaan & kalimat negatif": "pertanyaan",
  "Jamak & tak terhitung": "jamak",
  "Register & nada (lanjutan)": "kolokasi",
  "Kolokasi yang meleset (lanjutan)": "kolokasi",
  'Kata "sudah / belum / masih"': "sudah-belum",
};

/** Panduan grammar practice topics (and the Bertanya tab) → category. */
export const PRACTICE_CATEGORY: Record<PracticeTopic | "ask", string> = {
  ask: "pertanyaan",
  // Was / Have / Been: was–were, have, have + V3, have been, had.
  whb: "sudah-belum",
  irr: "tense",
  prep: "preposisi",
  bedo: "am-is-are",
  tense: "tense",
  conj: "kata-tertukar",
  thit: "am-is-are",
};
