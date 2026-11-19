// ─────────────────────────────────────────────────────────────────────────
// Kontrak catatan aktivitas "Rencana".
//
// Setiap menu melapor apa yang terjadi lewat SATU fungsi, laporAktivitas()
// (lib/rencana/lapor.ts), ke satu catatan tambah-saja (server:
// laporan_aktivitas). Rencana menghitung centang, streak, dan checkpoint
// HANYA dari catatan ini: tidak mengimpor komponen, state, atau
// penyimpanan menu lain.
//
// Jenis aktivitas dinamai menurut APA yang terjadi, bukan menu pengirimnya.
// Menu yang dirombak nanti cukup tetap mengirim jenis yang sama. Daftar
// `berkas` dicek oleh tes kontrak: setiap jenis yang dipakai langkah harus
// benar-benar dikirim dari berkas itu.
// ─────────────────────────────────────────────────────────────────────────

import type { MenuId } from "@/lib/types/session.types";

/** Menu pengirim (menu aplikasi, atau Rencana sendiri). */
export type MenuPengirim = MenuId;

/** Isi `data` tiap jenis. skor/total/jumlah ada di field laporan itu sendiri. */
export interface DataJenis {
  /** Satu kartu Ulang dijawab. */
  kartu_diulang: { kartu: "kata" | "kesalahan"; benar: boolean };
  /** Antrean Ulang hari ini habis setelah menjawab. */
  ulang_habis: Record<string, never>;
  /** Kuis 5 soal Buku kesalahanku / Kesalahan umum selesai. skor/total. */
  kuis_kesalahan_selesai: Record<string, never>;
  /** Kata ditandai hafal. `sisa`: kata minggu itu yang belum bertanda. */
  kata_ditandai: { kunci: string; sisa: number | null };
  /** Tanda hafal dibatalkan. */
  kata_batal: { kunci: string; sisa: number | null };
  /** Keadaan kata minggu aktif (bukan aktivitas; tidak pernah mencentang). */
  status_kata_minggu: { sisa: number; total: number };
  /** Tes cepat Kosakata selesai. skor/total. */
  tes_cepat_selesai: { lingkup: "week" | "all" };
  /** Satu teks Bacaan dijawab. skor/total. `baru`: pertama kali selesai. */
  bacaan_selesai: { textId: string; baru: boolean };
  /** Satu set Dengar & jawab selesai. skor/total. */
  dengar_selesai: { tahap: number };
  /** Satu set Dikte selesai. skor/total = kata benar / semua kata. */
  dikte_selesai: { tahap: number };
  /** Dialog Skenario diputar sampai baris terakhir. */
  dialog_diputar: { scenarioId: string };
  /** Satu baris dijawab di mode "jawab sendiri" Skenario. */
  dialog_dijawab: { scenarioId: string; baris: number };
  /** Satu soal latihan grammar dijawab. */
  jawaban_grammar: {
    topik: string;
    set: string;
    tahap: "mc" | "order" | "type";
    benar: boolean;
  };
  /** Satu kalimat buatan pelajar dicek AI. */
  kalimat_dicek: { benar: boolean; sumber: "rencana" | "tanya_ai" };
  /** Satu sesi Main peran selesai. */
  main_peran_selesai: {
    mode: "penuh" | "pendek";
    misi: boolean;
    scenarioId: string;
    giliran: number;
  };
  /** Ringkasan tugas nyata (checkpoint) diketik. jumlah = jumlah kata. */
  ringkasan_tugas: { teks: string };
  /** Pelajar memilih melewati langkah (hanya yang diizinkan Rencana). */
  langkah_dilewati: { langkah: string };
}

export type JenisAktivitas = keyof DataJenis;

export interface DefJenis {
  /** Menu yang mengirim. */
  menu: MenuPengirim;
  /** Berkas yang memanggil laporAktivitas("<jenis>", …). */
  berkas: string[];
  /** Field angka yang dipakai. */
  angka?: ("skor" | "total" | "jumlah")[];
}

export const JENIS_AKTIVITAS: Record<JenisAktivitas, DefJenis> = {
  kartu_diulang: {
    menu: "review",
    berkas: ["stores/useProgressStore.ts", "stores/useMistakeStore.ts"],
  },
  ulang_habis: {
    menu: "review",
    berkas: ["components/features/review/ReviewPage/ReviewPage.tsx"],
  },
  kuis_kesalahan_selesai: {
    menu: "review",
    berkas: ["components/features/review/ReviewQuiz/ReviewQuiz.tsx"],
    angka: ["skor", "total"],
  },
  kata_ditandai: { menu: "vocab", berkas: ["stores/useProgressStore.ts"] },
  kata_batal: { menu: "vocab", berkas: ["stores/useProgressStore.ts"] },
  status_kata_minggu: {
    menu: "vocab",
    berkas: ["components/features/vocab/WeekCover/WeekCover.tsx"],
  },
  tes_cepat_selesai: {
    menu: "vocab",
    berkas: ["stores/useQuizStore.ts"],
    angka: ["skor", "total"],
  },
  bacaan_selesai: {
    menu: "reading",
    berkas: ["stores/useReadingStore.ts"],
    angka: ["skor", "total"],
  },
  dengar_selesai: {
    menu: "listening",
    berkas: ["stores/useListeningStore.ts"],
    angka: ["skor", "total"],
  },
  dikte_selesai: {
    menu: "listening",
    berkas: ["stores/useListeningStore.ts"],
    angka: ["skor", "total"],
  },
  dialog_diputar: {
    menu: "scenario",
    berkas: ["components/features/scenario/ScenarioPage/ScenarioPage.tsx"],
  },
  dialog_dijawab: {
    menu: "scenario",
    berkas: ["components/features/scenario/ScenarioPage/ScenarioPage.tsx"],
  },
  jawaban_grammar: {
    menu: "grammar",
    berkas: ["components/features/ask/AskPractice/AskPractice.tsx"],
  },
  kalimat_dicek: {
    menu: "ai",
    berkas: [
      "lib/hooks/ai/useAiChat.ts",
      "components/features/plan/PakaiKalimat/PakaiKalimat.tsx",
    ],
  },
  main_peran_selesai: {
    menu: "roleplay",
    berkas: ["lib/hooks/roleplay/useRoleplaySession.ts"],
  },
  ringkasan_tugas: {
    menu: "plan",
    berkas: ["components/features/plan/CheckpointCard/CheckpointCard.tsx"],
    angka: ["jumlah"],
  },
  langkah_dilewati: {
    menu: "plan",
    berkas: ["components/features/plan/PlanPage/PlanPage.tsx"],
  },
};

/** Satu laporan (bentuk yang disimpan server dan dibaca Rencana). */
export interface Laporan<J extends JenisAktivitas = JenisAktivitas> {
  id: string;
  jenis: J;
  menu: MenuPengirim;
  level?: string | null;
  week?: number | null;
  /** Hari belajar (zona waktu token), seperti today(). */
  day: number;
  skor?: number | null;
  total?: number | null;
  jumlah?: number | null;
  data?: DataJenis[J] | null;
}
