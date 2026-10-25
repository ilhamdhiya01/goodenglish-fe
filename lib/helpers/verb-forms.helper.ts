import { VERB_CARDS, VERB_FORMS } from "@/lib/content";
import type { Flat } from "@/lib/helpers/level-data.helper";
import type { Item } from "@/lib/types/vocab.types";

// Bentuk kata kerja (V1 → V2 → V3) satu kartu, dipakai bersama oleh kartu kosakata dan pencarian.
export interface VerbForms {
  v2: string;
  v3: string;
  irregular: boolean;
  /** V1 = V2 = V3 persis (cut, put) → cukup ditulis sekali. */
  same: boolean;
  /** V-ing hanya kalau ejaannya tidak biasa (stopping, studying, lying). */
  ing: string;
}

/** Untuk dibacakan: buang catatan lafal "/red/" dan ambil varian pertama ("was / were" → "was"). */
export const strip = (s: string) =>
  s.replace(/\s*\/[^/]*\/\s*/g, "").split(" / ")[0];

// Varian bentuk untuk dicari: tanpa catatan lafal "/red/" dan isi kurung, dipecah per " / ".
const variants = (s: string) =>
  s
    .replace(/\s*\/[^/\s]+\//g, "")
    .replace(/\([^)]*\)/g, "")
    .split(/\s+\/\s+/)
    .map((x) => x.replace(/\s+/g, " ").trim().toLowerCase())
    .filter(Boolean);

/**
 * Bentuk dari data per kartu (sudah dicek arti per kartunya, mis. "light" = ringan bukan kata kerja).
 * Kata buatan pengguna (Kataku) jatuh ke tabel kata kerja tak beraturan / ejaan khusus.
 */
export const formsOf = (it: Item): VerbForms | null => {
  const [t, en, , id] = it;
  const lw = en.toLowerCase();
  const card = VERB_CARDS[t + "|" + en + "|" + id];
  const isMine = !!it[6];
  const irrF = !card && isMine && t === "w" ? VERB_FORMS.IRREG[lw] : null;
  const spF =
    !card && isMine && t === "w" && !irrF ? VERB_FORMS.SPELL[lw] : null;
  const v: [string, string, boolean] | null = card
    ? [card[0], card[1], !!card[2]]
    : irrF
      ? [irrF[0], irrF[1], true]
      : spF
        ? [spF[0], spF[0], false]
        : null;
  if (!v) return null;
  return {
    v2: v[0],
    v3: v[1],
    irregular: v[2],
    // "read → read /red/" tetap ditulis lengkap karena lafalnya beda.
    same: [v[0], v[1]].every((x) => x.toLowerCase() === lw),
    ing: VERB_FORMS.IRREG[lw]?.[2] || VERB_FORMS.SPELL[lw]?.[1] || "",
  };
};

/** "ride → rode → ridden", atau "cut" saja kalau ketiganya sama. */
export const formsLine = (en: string, f: VerbForms) =>
  f.same ? en : en + " → " + f.v2 + " → " + f.v3;

/** Semua varian V2/V3 dalam huruf kecil, mis. ["was", "were", "been"]. */
export const formVariants = (f: VerbForms | null): string[] =>
  f ? [...variants(f.v2), ...variants(f.v3)] : [];

/** Teks V2/V3 untuk pencocokan "mengandung", mis. "rode ridden". */
export const formsSearchText = (f: VerbForms | null) =>
  formVariants(f).join(" ");

export interface SearchRow {
  x: Flat;
  en: string;
  id: string;
  f: VerbForms | null;
  fv: string[];
}
export interface SearchHit {
  x: Flat;
  f: VerbForms | null;
  /** Muncul karena cocok dengan bentuk V2/V3, bukan kata atau artinya. */
  viaForm: boolean;
}

/** Hitung sekali per kumpulan kata (bentuk kata kerja per kartu). */
export const buildSearchIndex = (pool: Flat[]): SearchRow[] =>
  pool.map((x) => {
    const f = formsOf(x.it);
    return {
      x,
      en: x.it[1].toLowerCase(),
      id: x.it[3].toLowerCase(),
      f,
      fv: formVariants(f),
    };
  });

/**
 * Urutan: kata yang diawali kata kunci → bentuk V2/V3 yang diawali kata kunci (rode → ride)
 * → kata, arti, atau bentuk yang mengandung kata kunci.
 */
export const searchVocab = (
  index: SearchRow[],
  q: string,
  limit = 40,
): SearchHit[] => {
  const ql = q.trim().toLowerCase();
  if (!ql) return [];
  const starts: SearchHit[] = [];
  const formStarts: SearchHit[] = [];
  const rest: SearchHit[] = [];
  for (const r of index) {
    if (r.en.startsWith(ql)) starts.push({ x: r.x, f: r.f, viaForm: false });
    else if (r.fv.some((v) => v.startsWith(ql)))
      formStarts.push({ x: r.x, f: r.f, viaForm: true });
    else if (r.en.includes(ql) || r.id.includes(ql))
      rest.push({ x: r.x, f: r.f, viaForm: false });
    else if (r.fv.some((v) => v.includes(ql)))
      rest.push({ x: r.x, f: r.f, viaForm: true });
  }
  return starts.concat(formStarts, rest).slice(0, limit);
};
