// Progres belajar pengguna (dipersist ke localStorage — kunci di const/storage-keys.ts).

/** Entri spaced-repetition: st = tahap (index ke GAPS), due = hari jatuh tempo. */
export interface SrsEntry {
  st: number;
  due: number;
}

/** Bentuk file JSON ekspor/impor progres (format v3, kompatibel v1/v2). */
export interface ProgressSnapshot {
  v: number;
  exportedAt: string;
  known: Record<string, 1>;
  srs: Record<string, SrsEntry>;
  own: Record<string, string>;
  custom?: unknown;
  level?: string;
  plan?: unknown;
  askprac?: unknown;
}
