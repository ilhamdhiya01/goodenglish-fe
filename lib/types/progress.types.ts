// Progres belajar pengguna (dipersist ke localStorage — kunci di const/storage-keys.ts).

/** Entri spaced-repetition: st = tahap (index ke GAPS), due = hari jatuh tempo. */
export interface SrsEntry {
  st: number;
  due: number;
  /** Berapa kali dijawab "Lupa" di Ulang hari ini. Opsional: data lama tidak punya. */
  lapses?: number;
}

/** Bentuk file JSON ekspor/impor progres (format v7, kompatibel v1–v6). */
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
  /** v4: riwayat Main peran (RoleplayRecord[]). */
  roleplay?: unknown;
  /** v4–v6: kesalahan (array lama); v7: Buku kesalahanku (MistakeData). */
  mistakes?: unknown;
  /** v5: Menyimak (ListeningData). */
  listening?: unknown;
  /** v6: Bacaan (ReadingData). Kartu pribadinya ada di `custom`. */
  reading?: unknown;
}
