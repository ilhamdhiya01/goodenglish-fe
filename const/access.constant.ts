import type { LevelId, MenuId } from "@/lib/types/session.types";

// Backend error codes (errors[0].message) → what the learner reads.
export const ACCESS_ERRORS: Record<string, string> = {
  invalid_token:
    "Token tidak dikenal. Periksa lagi, mungkin ada karakter yang terlewat.",
  token_revoked: "Token ini sudah dinonaktifkan. Hubungi admin.",
  token_expired: "Masa berlaku token ini sudah habis. Hubungi admin.",
  device_limit:
    "Token ini sudah dipakai di jumlah perangkat maksimal. Keluar dari perangkat lain, atau minta admin mereset perangkatnya.",
  session_invalid: "Sesi sudah berakhir. Masukkan token lagi.",
  last_admin: "Harus tetap ada minimal satu token admin yang aktif.",
  menus_required: "Pilih minimal satu menu.",
  levels_required: "Pilih minimal satu level.",
  word_exists: "Kata ini sudah ada di level tersebut.",
  word_not_found: "Kata tidak ditemukan. Mungkin sudah dihapus.",
  ai_not_allowed: "Token ini belum bisa memakai Tanya AI. Hubungi admin.",
  ai_unavailable: "Tanya AI sedang tidak tersedia. Coba lagi nanti.",
  ai_quota_exceeded:
    "Jatah pertanyaan AI hari ini sudah habis. Coba lagi besok, ya.",
  ai_failed: "AI sedang tidak bisa menjawab. Coba kirim lagi sebentar lagi.",
  ai_bad_question:
    "Pertanyaannya terlalu panjang. Singkatkan, lalu kirim lagi.",
  ai_key_invalid: "API key ditolak Google. Periksa lagi key-nya.",
  ai_key_check_failed:
    "Google sedang tidak bisa dihubungi untuk mengecek key. Coba lagi sebentar.",
  encryption_key_missing:
    "ENCRYPTION_KEY belum di-set di .env server, jadi key tidak bisa disimpan.",
  model_invalid: "Nama model tidak valid.",
};

// Why the model picker shows the built-in list instead of Google's.
export const AI_MODELS_WARNINGS: Record<string, string> = {
  no_key: "Belum ada key tersimpan: daftar di bawah adalah model bawaan.",
  ai_key_invalid:
    "Key tersimpan ditolak Google: daftar di bawah adalah model bawaan.",
  ai_key_unreadable:
    "Key tersimpan tidak bisa dibaca server: daftar di bawah adalah model bawaan.",
  ai_models_unavailable:
    "Google tidak bisa dihubungi: daftar di bawah adalah model bawaan.",
};

export const accessErrorText = (code?: string) =>
  (code && ACCESS_ERRORS[code]) || "Terjadi kesalahan. Coba lagi.";

export const MENU_OPTIONS: { id: MenuId; label: string }[] = [
  { id: "plan", label: "Rencana" },
  { id: "vocab", label: "Kosakata" },
  { id: "review", label: "Ulang hari ini" },
  { id: "scenario", label: "Skenario" },
  { id: "errors", label: "Kesalahan umum" },
  { id: "grammar", label: "Panduan grammar" },
  { id: "pronunciation", label: "Pelafalan" },
  { id: "cheatsheet", label: "Cheat sheet" },
  { id: "ai", label: "Tanya AI" },
];

export const LEVEL_OPTIONS: { id: LevelId; label: string }[] = [
  { id: "beginner", label: "Pemula" },
  { id: "pre", label: "Pre-intermediate" },
  { id: "inter", label: "Intermediate" },
  { id: "upper", label: "Upper-intermediate" },
];
