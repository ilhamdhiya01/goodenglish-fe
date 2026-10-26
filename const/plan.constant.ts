import type { PlanRow } from "@/lib/types/vocab.types";

// Rencana 12 minggu untuk level Pre-intermediate (level lain punya plan sendiri di data).
export const PRE_PLAN: PlanRow[] = [
  [1, "Kenalan & rutinitas harian", "Present Simple", "and, but, so, because"],
  [2, "Rumah, makanan & belanja", "Present Continuous", "when, while, then"],
  [
    3,
    "Kerja, kantor & meeting",
    "Past Simple",
    "first, then, after that, before",
  ],
  [
    4,
    "Small talk, perasaan & opini",
    "Future: will & going to",
    "if, unless, although, however",
  ],
  [
    5,
    "Travel, arah & transportasi",
    "Present Perfect",
    "since, for, already, yet",
  ],
  [
    6,
    "Tech & software engineering",
    "Passive voice (dasar)",
    "so that, in order to",
  ],
  [7, "Interview kerja", "Past Continuous", "while, as, during"],
  [
    8,
    "Presentasi",
    "Modal: can, should, must, might",
    "therefore, as a result",
  ],
  [
    9,
    "Diskusi & membandingkan",
    "Comparatives & superlatives",
    "whereas, on the other hand",
  ],
  [
    10,
    "Masalah, solusi & negosiasi",
    "First conditional",
    "as long as, in case",
  ],
  [
    11,
    "Cerita & pengalaman",
    "Narrative (past + past continuous)",
    "eventually, meanwhile",
  ],
  [
    12,
    "Review & ekspresi natural",
    "Campuran semua tense",
    "even though, despite",
  ],
];

// Ambang centang otomatis blok harian (lihat PlanAutoCheck).
// Blok 1 tidak punya ambang: selesai saat jatuh tempo habis.
export const AUTO_CHECK = {
  /** Blok 2: kata yang ditandai hafal hari ini. */
  known: 10,
  /** Blok 3 hari ganjil: soal latihan Bertanya yang dijawab hari ini. */
  ask: 20,
} as const;

// Rumus "Bertanya" yang dirotasi di blok 3 hari ganjil (id cocok dengan data ask.js).
export const ASK_RULES: [string, string][] = [
  ["r1", "Rumus 1"],
  ["r2", "Rumus 2"],
  ["r3", "Rumus 3"],
  ["r4", "Rumus 4"],
];
