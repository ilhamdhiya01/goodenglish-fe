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
];

export const LEVEL_OPTIONS: { id: LevelId; label: string }[] = [
  { id: "beginner", label: "Pemula" },
  { id: "pre", label: "Pre-intermediate" },
  { id: "inter", label: "Intermediate" },
  { id: "upper", label: "Upper-intermediate" },
];
