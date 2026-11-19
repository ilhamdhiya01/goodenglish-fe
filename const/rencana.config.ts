// ─────────────────────────────────────────────────────────────────────────
// Rencana harian: semua langkah, isi per hari, durasi, streak, checkpoint,
// dan setiap angka ambang ada di sini (satu-satunya file ambang Rencana di
// FE; BE punya src/common/rencana.config.ts).
//
// Langkah adalah DATA: menambah, mengganti, atau mengurutkan ulang langkah
// cukup mengubah LANGKAH di bawah. Evaluator (lib/rencana/evaluasi.ts)
// hanya membaca catatan aktivitas (lib/rencana/rencana.contract.ts).
// ─────────────────────────────────────────────────────────────────────────

import type { JenisAktivitas } from "@/lib/rencana/rencana.contract";
import type { MenuId } from "@/lib/types/session.types";

export const RENCANA = {
  /** Ulang: selesai setelah kartu sebanyak ini diulang hari itu. */
  ulangKartu: 20,
  /** Kata: kata minggu aktif yang ditandai hafal hari itu. */
  kataHarian: 6,
  /** Bacaan dihitung selesai dengan skor ≥ ini (dari 5). */
  bacaanLulus: 4,
  /** Dengar & jawab dihitung dengan bagian benar ≥ ini. */
  dengarLulus: 2 / 3,
  /** Bentuk: jawaban pada topik grammar minggu itu, hari itu. */
  grammarHarian: 10,
  /** Pakai: kalimat buatan sendiri yang dicek AI. */
  kalimatHarian: 3,
  /** Pakai (Rabu): baris yang dijawab di mode "jawab sendiri" Skenario. */
  jawabSendiri: 3,
  /** Checkpoint: tes cepat lingkup minggu ini (bagian benar). */
  tesCepatLulus: 16 / 20,
  /** Checkpoint: akurasi tahap ketik dan jumlah soal minimal. */
  grammarKetikAkurasi: 0.8,
  grammarKetikMinimal: 10,
  /** Checkpoint: satu set Dikte dengan bagian kata benar ≥ ini. */
  dikteLulus: 0.8,
  /** Checkpoint: panjang ringkasan tugas nyata (kata). */
  ringkasanMin: 60,
  ringkasanMax: 100,
  /** Checkpoint lulus dengan syarat terpenuhi sebanyak ini (dari 4). */
  checkpointLulus: 3,
  /** Hari laporan yang dimuat dari server. */
  laporanDimuatHari: 45,
  /** Laporan per kiriman (batas server 100). */
  laporanPerKirim: 50,
  /** Pilihan durasi (menit). */
  durasi: [15, 25, 40] as const,
  durasiBawaan: 25 as const,
} as const;

export type Durasi = (typeof RENCANA.durasi)[number];
/** 0 = Minggu … 6 = Sabtu (getUTCDay dari nomor hari). */
export type Hari = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const SEN_KAM: Hari[] = [1, 2, 3, 4];
export const HARI_KERJA: Hari[] = [1, 2, 3, 4, 5];
export const SEMUA_HARI: Hari[] = [0, 1, 2, 3, 4, 5, 6];
export const NAMA_HARI = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

/** Saringan laporan (logikanya di lib/rencana/evaluasi.ts). */
export type Saring =
  /** Level dan minggu laporan = level dan minggu aktif. */
  | "minggu_aktif"
  /** Bacaan dengan skor ≥ bacaanLulus yang baru pertama kali selesai. */
  | "bacaan_lulus"
  /** Dengar & jawab dengan bagian benar ≥ dengarLulus. */
  | "dengar_lulus"
  /** Topik grammar laporan = topik minggu aktif. */
  | "topik_minggu"
  /** Skenario laporan = skenario minggu aktif. */
  | "skenario_minggu"
  | "mode_pendek"
  | "mode_penuh"
  /** langkah_dilewati untuk langkah ini. */
  | "langkah_ini";

/** Keadaan yang membuat sebuah syarat berlaku. */
export type Bila =
  /** Semua kata minggu aktif sudah bertanda (dari laporan Kosakata). */
  | "minggu_habis"
  /** Main peran tidak bisa (menu mati atau kuota habis). */
  | "tanpa_main_peran";

/** Satu cara menyelesaikan langkah. Langkah selesai bila SALAH SATU terpenuhi. */
export interface Syarat {
  jenis: JenisAktivitas;
  /** Jumlah laporan (hari ini) yang lolos saringan. */
  ambang: number;
  saring?: Saring[];
  /** "bersih": kata_ditandai dikurangi kata_batal per kunci. */
  cara?: "bersih";
  /** Juga butuh laporan lain hari ini (mis. ulang_habis setelah ≥1 kartu). */
  butuh?: { jenis: JenisAktivitas; ambang: number };
  bila?: Bila;
  /**
   * Laporan yang dipakai langkah ini tidak bisa menyelesaikan langkah lain
   * yang juga eksklusif (satu Dikte tidak dihitung untuk Masuk dan Lancar).
   */
  eksklusif?: boolean;
}

export type LangkahId =
  | "ulang"
  | "kata"
  | "masuk"
  | "bentuk"
  | "pakai"
  | "lancar"
  | "ekstra_masuk"
  | "ekstra_main_peran";

/** Isi langkah untuk hari tertentu (menimpa isi bawaan). */
export interface VarianLangkah {
  judul?: string;
  isi?: string;
  /** Tautan; {topik} {skenario} diganti sesuai minggu aktif. */
  tautan?: string;
  /** "pakai_kalimat": panel 3 kalimat di halaman Rencana. */
  aksi?: "pakai_kalimat";
  /** Langkah tampil bila salah satu menu ini dibuka token. */
  menu?: MenuId[];
  selesaiBila?: Syarat[];
  /** Pengganti saat syarat `bila` berlaku (mis. tanpa Main peran). */
  cadangan?: Omit<VarianLangkah, "cadangan"> & { bila: Bila };
}

export interface DefLangkah extends Required<
  Pick<VarianLangkah, "judul" | "isi" | "tautan" | "menu" | "selesaiBila">
> {
  id: LangkahId;
  aksi?: VarianLangkah["aksi"];
  /** Hari langkah ini muncul. */
  hari: Hari[];
  /** Durasi yang memuat langkah ini. */
  durasi: Durasi[];
  /** Hari langkah ini dihitung untuk streak. */
  streak: Hari[];
  /** Tautan kedua (mis. Dikte saat bahan habis). */
  alternatif?: { judul: string; tautan: string };
  /** Boleh dilewati (langkah_dilewati) bila syarat `bila` berlaku. */
  lewati?: Bila;
  perHari?: Partial<Record<Hari, VarianLangkah>>;
  cadangan?: VarianLangkah["cadangan"];
}

const SEMUA_DURASI: Durasi[] = [15, 25, 40];

const KALIMAT: VarianLangkah = {
  judul: "Pakai",
  isi: "Tulis 3 kalimat sendiri, lalu cek dengan AI.",
  tautan: "#pakai",
  aksi: "pakai_kalimat",
  menu: ["ai"],
  selesaiBila: [{ jenis: "kalimat_dicek", ambang: RENCANA.kalimatHarian }],
};

export const LANGKAH: DefLangkah[] = [
  {
    id: "ulang",
    judul: "Ulang",
    isi: "Kartu yang jatuh tempo hari ini (paling banyak 20).",
    tautan: "/review",
    menu: ["review"],
    hari: SEMUA_HARI,
    durasi: SEMUA_DURASI,
    streak: SEMUA_HARI,
    selesaiBila: [
      { jenis: "kartu_diulang", ambang: RENCANA.ulangKartu },
      {
        jenis: "ulang_habis",
        ambang: 1,
        butuh: { jenis: "kartu_diulang", ambang: 1 },
      },
      { jenis: "kuis_kesalahan_selesai", ambang: 1 },
    ],
  },
  {
    id: "kata",
    judul: "Kata",
    isi: "Tandai 6 kata hari ini di Kosakata minggu ini.",
    tautan: "/vocab",
    menu: ["vocab"],
    hari: HARI_KERJA,
    durasi: SEMUA_DURASI,
    streak: SEN_KAM,
    lewati: "minggu_habis",
    selesaiBila: [
      {
        jenis: "kata_ditandai",
        cara: "bersih",
        ambang: RENCANA.kataHarian,
        saring: ["minggu_aktif"],
      },
      // Kata minggu ini sudah habis: kata minggu lain, atau lewati.
      {
        jenis: "kata_ditandai",
        cara: "bersih",
        ambang: 1,
        bila: "minggu_habis",
      },
      {
        jenis: "langkah_dilewati",
        ambang: 1,
        saring: ["langkah_ini"],
        bila: "minggu_habis",
      },
    ],
    perHari: {
      5: {
        judul: "Kata",
        isi: "Kuis 5 soal dari Buku kesalahanku.",
        tautan: "/review?kuis=1",
        menu: ["review"],
        selesaiBila: [{ jenis: "kuis_kesalahan_selesai", ambang: 1 }],
      },
    },
  },
  {
    id: "masuk",
    judul: "Masuk",
    isi: "Satu bacaan.",
    tautan: "/reading",
    menu: ["reading", "listening", "scenario"],
    hari: HARI_KERJA,
    durasi: SEMUA_DURASI,
    streak: HARI_KERJA,
    alternatif: {
      judul: "Tidak ada bahan? Satu set Dikte",
      tautan: "/listening/dikte",
    },
    // Jenis masukan mana pun dihitung, Dikte paling akhir (cadangan).
    selesaiBila: [
      {
        jenis: "bacaan_selesai",
        ambang: 1,
        saring: ["bacaan_lulus"],
        eksklusif: true,
      },
      {
        jenis: "dengar_selesai",
        ambang: 1,
        saring: ["dengar_lulus"],
        eksklusif: true,
      },
      { jenis: "dialog_diputar", ambang: 1, eksklusif: true },
      { jenis: "dikte_selesai", ambang: 1, eksklusif: true },
    ],
    perHari: {
      2: { isi: "Satu set Dengar & jawab.", tautan: "/listening/dengar" },
      3: {
        isi: "Putar dialog Skenario minggu ini sampai habis.",
        tautan: "/scenario?s={skenario}",
      },
      5: { isi: "Satu set Dengar & jawab.", tautan: "/listening/dengar" },
    },
  },
  {
    id: "bentuk",
    judul: "Bentuk",
    isi: "10 soal grammar topik minggu ini.",
    tautan: "/grammar/{topik}",
    menu: ["grammar"],
    hari: HARI_KERJA,
    durasi: [25, 40],
    streak: [],
    selesaiBila: [
      {
        jenis: "jawaban_grammar",
        ambang: RENCANA.grammarHarian,
        saring: ["topik_minggu"],
      },
    ],
  },
  {
    id: "pakai",
    ...KALIMAT,
    judul: "Pakai",
    isi: KALIMAT.isi!,
    tautan: KALIMAT.tautan!,
    menu: KALIMAT.menu!,
    selesaiBila: KALIMAT.selesaiBila!,
    hari: HARI_KERJA,
    durasi: SEMUA_DURASI,
    streak: HARI_KERJA,
    perHari: {
      3: {
        isi: 'Skenario minggu ini, mode "jawab sendiri": jawab minimal 3 baris.',
        tautan: "/scenario?s={skenario}",
        aksi: undefined,
        menu: ["scenario"],
        selesaiBila: [
          {
            jenis: "dialog_dijawab",
            ambang: RENCANA.jawabSendiri,
            saring: ["skenario_minggu"],
          },
        ],
      },
      4: {
        isi: "Main peran latihan pendek (6 giliran) sampai selesai.",
        tautan: "/scenario/roleplay/{skenario}?mode=pendek",
        aksi: undefined,
        menu: ["roleplay"],
        selesaiBila: [
          { jenis: "main_peran_selesai", ambang: 1, saring: ["mode_pendek"] },
        ],
        // Tanpa Main peran atau kuota habis: kembali ke 3 kalimat.
        cadangan: { ...KALIMAT, bila: "tanpa_main_peran" },
      },
    },
  },
  {
    id: "lancar",
    judul: "Lancar",
    isi: "Satu set Dikte dari kalimat yang sudah kamu kenal.",
    tautan: "/listening/dikte",
    menu: ["listening"],
    hari: HARI_KERJA,
    durasi: [25, 40],
    streak: [],
    selesaiBila: [{ jenis: "dikte_selesai", ambang: 1, eksklusif: true }],
  },
  {
    id: "ekstra_masuk",
    judul: "Tambahan",
    isi: "Satu Bacaan atau Dengar & jawab lagi.",
    tautan: "/reading",
    menu: ["reading", "listening"],
    hari: HARI_KERJA,
    durasi: [40],
    streak: [],
    alternatif: { judul: "Dengar & jawab", tautan: "/listening/dengar" },
    selesaiBila: [
      {
        jenis: "bacaan_selesai",
        ambang: 1,
        saring: ["bacaan_lulus"],
        eksklusif: true,
      },
      {
        jenis: "dengar_selesai",
        ambang: 1,
        saring: ["dengar_lulus"],
        eksklusif: true,
      },
    ],
  },
  {
    id: "ekstra_main_peran",
    judul: "Main peran",
    isi: "Satu sesi Main peran penuh (12 giliran).",
    tautan: "/scenario/roleplay/{skenario}?mode=penuh",
    menu: ["roleplay"],
    hari: HARI_KERJA,
    durasi: [40],
    streak: [],
    selesaiBila: [
      { jenis: "main_peran_selesai", ambang: 1, saring: ["mode_penuh"] },
    ],
  },
];

/** Checkpoint mingguan: Sabtu, Minggu, Senin. */
export const HARI_CHECKPOINT: Hari[] = [6, 0, 1];

export type CheckpointId = "kosakata" | "grammar" | "menyimak" | "tugas";

export interface DefCheckpoint {
  id: CheckpointId;
  judul: string;
  isi: string;
  tautan: string;
  menu: MenuId;
  /** Harus termasuk yang terpenuhi agar lulus. */
  wajib?: boolean;
}

export const CHECKPOINT: DefCheckpoint[] = [
  {
    id: "kosakata",
    judul: "Kosakata",
    isi: 'Tes cepat "Minggu ini" ≥ 16/20, dikerjakan Sabtu–Senin.',
    tautan: "/vocab",
    menu: "vocab",
  },
  {
    id: "grammar",
    judul: "Grammar",
    isi: "Tahap ketik pada topik minggu ini: ≥ 80% dari minimal 10 soal.",
    tautan: "/grammar/{topik}",
    menu: "grammar",
  },
  {
    id: "menyimak",
    judul: "Menyimak",
    isi: "Satu set Dikte dengan ≥ 80% kata benar.",
    tautan: "/listening/dikte",
    menu: "listening",
  },
  {
    id: "tugas",
    judul: "Tugas nyata",
    isi: "Main peran penuh skenario minggu ini sampai misi tercapai, lalu ringkasan 60–100 kata.",
    tautan: "/scenario/roleplay/{skenario}?mode=penuh",
    menu: "roleplay",
    wajib: true,
  },
];

/** Topik grammar → halaman Panduan grammar. "r" = Bertanya. */
export const TOPIK_HALAMAN: Record<string, string> = {
  whb: "been",
  irr: "irr",
  prep: "prep",
  bedo: "bedo",
  tense: "tense",
  thit: "thit",
  conj: "conj",
  r: "ask",
};

/** Topik minggu tanpa peta admin. */
export const TOPIK_BAWAAN = "r";

/** Topik dari id set latihan ("whb3" → "whb", "r2" → "r"). */
export const topikDariSet = (set: string) => set.replace(/\d+$/, "");
