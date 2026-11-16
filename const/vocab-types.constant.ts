// Jenis kata → label + gaya chip. Semua jenis memakai chip netral yang sama:
// jenisnya dibaca dari label, bukan dari warna.
export interface WordTypeDef {
  label: string;
  chip: string;
}

const CHIP = "bg-chip text-ink-2";

export const TYPES: Record<string, WordTypeDef> = {
  w: { label: "Kata dasar", chip: CHIP },
  pv: { label: "Phrasal verb", chip: CHIP },
  col: { label: "Collocation", chip: CHIP },
  st: { label: "Pembuka / filler", chip: CHIP },
  ex: { label: "Ekspresi", chip: CHIP },
  cj: { label: "Kata sambung", chip: CHIP },
};

export const typeDef = (t: string): WordTypeDef => TYPES[t] || TYPES.w;
