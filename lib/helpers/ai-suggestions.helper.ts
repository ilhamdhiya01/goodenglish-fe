import type { PlanRow } from "@/lib/types/vocab.types";

// Saran pertanyaan di panel Tanya AI yang masih kosong: satu-dua dari halaman
// yang sedang dibuka (topik/tense minggu aktif di Rencana), plus kata yang
// paling sering dijawab "Lupa" di Ulang hari ini — atau, sebelum ada data
// itu, kata yang sedang jatuh tempo.

export interface SuggestionWord {
  en: string;
  meaning: string;
}

export interface SuggestionInput {
  /** Segmen route pertama: "vocab", "grammar", "review", … */
  page: string;
  week: number;
  /** Baris Rencana minggu aktif: [minggu, topik, tense, kata sambung]. */
  plan?: PlanRow;
  /** Paling sering lupa dulu. */
  forgotten: SuggestionWord[];
  due: SuggestionWord[];
}

const MAX = 3;

const pageIdeas = (page: string, week: number, plan?: PlanRow): string[] => {
  if (!plan) return [];
  const [, topic, tense, conj] = plan;
  const conjs = conj
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  switch (page) {
    case "vocab":
      return [
        `Beri 3 contoh kalimat sehari-hari tentang "${topic}".`,
        `Kata atau frasa apa lagi yang berguna untuk topik "${topic}"?`,
      ];
    case "grammar":
    case "cheatsheet":
      return [
        `Jelaskan ${tense} dengan contoh sehari-hari.`,
        ...(conjs.length >= 2
          ? [`Kapan pakai "${conjs[0]}" dan kapan "${conjs[1]}"?`]
          : []),
      ];
    case "scenario":
      return [
        `Latih aku percakapan singkat tentang "${topic}". Kamu jadi lawan bicaranya, mulai duluan.`,
      ];
    case "errors":
      return [
        `Kesalahan apa yang paling sering dibuat orang Indonesia saat memakai ${tense}?`,
      ];
    case "pronunciation":
      return [
        `Kata apa di topik "${topic}" yang sering salah diucapkan orang Indonesia?`,
      ];
    case "plan":
      return [`Apa yang perlu aku kuasai di minggu ${week}: "${topic}"?`];
    // Ulang hari ini: saran kata saja (lihat wordIdeas).
    default:
      return [];
  }
};

const short = (s: string) => (s.length > 40 ? s.slice(0, 40) + "…" : s);

const wordIdeas = (forgotten: SuggestionWord[], due: SuggestionWord[]) => [
  ...forgotten.map(
    (w) =>
      `Aku sering lupa "${w.en}" (${short(w.meaning)}). Beri trik mengingatnya dan 2 contoh kalimat.`,
  ),
  ...due.map(
    (w) =>
      `Bantu aku mengingat "${w.en}" (${short(w.meaning)}) dengan contoh kalimat.`,
  ),
];

const FALLBACK = [
  "Apa bedanya sometime dan sometimes?",
  "Kapan pakai present perfect, bukan past simple?",
];

export const buildSuggestions = (input: SuggestionInput): string[] => {
  const page = pageIdeas(input.page, input.week, input.plan);
  const words = wordIdeas(input.forgotten, input.due);
  // Di halaman Ulang, kata-kata itulah konteksnya: beri mereka tempat lebih.
  const pageSlots = input.page === "review" ? 0 : Math.min(page.length, 2);
  const picked = [...page.slice(0, pageSlots), ...words].slice(0, MAX);
  for (const f of FALLBACK) if (picked.length < 2) picked.push(f);
  return picked;
};
