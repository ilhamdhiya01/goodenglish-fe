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
  ai_conversation_not_found: "Percakapan ini sudah dihapus.",
  ai_bad_question:
    "Pertanyaannya terlalu panjang. Singkatkan, lalu kirim lagi.",
  ai_key_invalid: "API key ditolak Google. Periksa lagi key-nya.",
  ai_key_check_failed:
    "Google sedang tidak bisa dihubungi untuk mengecek key. Coba lagi sebentar.",
  encryption_key_missing:
    "ENCRYPTION_KEY belum di-set di .env server, jadi key tidak bisa disimpan.",
  model_invalid: "Nama model tidak valid.",
  roleplay_not_allowed:
    "Token ini belum bisa memakai Main peran. Hubungi admin.",
  roleplay_quota_exceeded:
    "Jatah sesi Main peran hari ini sudah habis. Coba lagi besok, ya.",
  roleplay_turn_limit: "Sesi ini sudah mencapai 12 giliran.",
  roleplay_help_limit:
    "Bantuan untuk sesi ini sudah habis. Coba jawab sendiri, ya.",
  roleplay_session_expired: "Sesi ini sudah terlalu lama. Mulai sesi baru, ya.",
  roleplay_session_not_found: "Sesi tidak ditemukan. Mulai sesi baru, ya.",
  roleplay_ended: "Sesi ini sudah selesai.",
  roleplay_no_turns: "Belum ada jawabanmu, jadi belum ada yang dirangkum.",
  roleplay_bad_turn: "Tulis atau ucapkan jawabanmu dulu.",
  roleplay_transcribe_limit:
    "Batas rekaman suara untuk sesi ini sudah habis. Ketik jawabanmu, ya.",
  roleplay_finish_limit:
    "Ringkasan sesi ini sudah diambil beberapa kali. Mulai sesi baru, ya.",
  listening_not_allowed:
    "Token ini belum bisa membuka Menyimak. Hubungi admin.",
  listening_not_found: "Soal ini sudah dihapus.",
  listening_bad_title: "Judul wajib diisi.",
  listening_bad_lines:
    "Baris audio tidak valid: dialog butuh penutur A dan B, monolog hanya A.",
  listening_word_count: "Panjang audio harus 40–120 kata.",
  listening_bad_questions:
    "Harus ada 3 soal, masing-masing 4 pilihan berbeda, satu kunci, dan penjelasan.",
  reading_not_allowed: "Token ini belum bisa membuka Bacaan. Hubungi admin.",
  reading_not_found: "Bacaan ini sudah dihapus.",
  reading_bad_title: "Judul wajib diisi.",
  reading_bad_paragraphs:
    "Paragraf tidak valid: setiap paragraf butuh teks Inggris dan terjemahannya (maks. 10).",
  reading_bad_questions:
    "Harus ada 5 soal: 3 pilihan ganda (4 pilihan berbeda + kunci + pembahasan), 1 benar/salah, 1 temukan kata.",
  reading_slot_taken:
    "Slot ini sudah punya bacaan yang terbit. Sembunyikan yang lama dulu.",
  reading_has_warnings:
    "Bacaan ini belum memenuhi syarat. Terbitkan dengan konfirmasi.",
  word_meaning_not_found: "Arti kata ini sudah dihapus.",
  lookup_rate_limited:
    "Terlalu banyak kata baru dicari dalam semenit. Tunggu sebentar, ya.",
  lookup_bad_word: "Kata ini tidak bisa dicari.",
  level_not_allowed: "Level ini tidak dibuka untuk token ini.",
  review_not_allowed: "Token ini belum bisa membuka Ulang. Hubungi admin.",
  stt_no_speech: "Suaramu tidak terdengar, coba lagi ya.",
  stt_not_english:
    "Kedengarannya bukan bahasa Inggris. Ucapkan ungkapannya dalam bahasa Inggris, ya.",
  stt_too_long: "Rekamannya terlalu panjang (maksimal 60 detik).",
  stt_too_large: "Rekamannya terlalu besar. Coba jawab lebih singkat, ya.",
  stt_bad_audio: "Rekamannya tidak bisa dibaca. Coba rekam lagi, ya.",
  stt_bad_language: "Pilih bahasa EN atau ID dulu.",
  stt_busy: "Server sedang sibuk. Tunggu sebentar, lalu coba lagi.",
  stt_rate_limited:
    "Terlalu banyak rekaman dalam semenit. Tunggu sebentar, ya.",
  stt_timeout:
    "Server terlalu lama memproses suaramu. Coba lagi dengan jawaban lebih pendek.",
  stt_unavailable:
    "Fitur suara sedang tidak tersedia. Ketik jawabanmu dulu, ya.",
  stt_failed: "Suaramu belum bisa dituliskan. Coba lagi, ya.",
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
  { id: "listening", label: "Menyimak" },
  { id: "reading", label: "Bacaan" },
  { id: "progress", label: "Progres" },
  { id: "cheatsheet", label: "Cheat sheet" },
  { id: "ai", label: "Tanya AI" },
  { id: "roleplay", label: "Main peran" },
];

// Menus that are not pages: a learner token needs at least one other one.
export const NON_TAB_MENUS: MenuId[] = ["ai", "roleplay"];

export const LEVEL_OPTIONS: { id: LevelId; label: string }[] = [
  { id: "beginner", label: "Pemula" },
  { id: "pre", label: "Pre-intermediate" },
  { id: "inter", label: "Intermediate" },
  { id: "upper", label: "Upper-intermediate" },
];
