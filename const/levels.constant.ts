// [id, nama tampil, deskripsi] — urutan = urutan kartu di pemilih level.
export const LEVELS: [string, string, string][] = [
  [
    "beginner",
    "Pemula",
    "Tahu kata dasar, susah bikin kalimat. Angka, benda, keluarga, 3 tense dasar.",
  ],
  [
    "pre",
    "Pre-intermediate",
    "Bisa kalimat pendek, sering macet. Rutinitas, kerja, travel, 12 tense.",
  ],
  [
    "inter",
    "Intermediate",
    "Bisa ngobrol, tapi kosakata terbatas dan kaku. Collocation, nuansa kata, tense lanjutan.",
  ],
  [
    "upper",
    "Upper-intermediate",
    "Lancar, mau lebih natural. Idiom, register formal vs santai, hedging.",
  ],
];

export const LV_SHORT: Record<string, string> = {
  beginner: "PEMULA",
  pre: "PRE",
  inter: "INTER",
  upper: "UPPER",
};

export const levelName = (id: string): string =>
  (LEVELS.find((l) => l[0] === id) || LEVELS[1])[1];
