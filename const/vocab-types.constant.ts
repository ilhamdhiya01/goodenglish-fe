// Jenis kata → label + warna badge (class Tailwind, tint di index.css @theme).
export interface WordTypeDef {
  label: string;
  chip: string;
}

export const TYPES: Record<string, WordTypeDef> = {
  w: { label: "Kata dasar", chip: "bg-tint-w text-ink-w" },
  pv: { label: "Phrasal verb", chip: "bg-tint-pv text-ink-pv" },
  col: { label: "Collocation", chip: "bg-tint-col text-ink-col" },
  st: { label: "Pembuka / filler", chip: "bg-tint-st text-ink-st" },
  ex: { label: "Ekspresi", chip: "bg-tint-ex text-ink-ex" },
  cj: { label: "Kata sambung", chip: "bg-tint-cj text-ink-cj" },
};

export const typeDef = (t: string): WordTypeDef => TYPES[t] || TYPES.w;
