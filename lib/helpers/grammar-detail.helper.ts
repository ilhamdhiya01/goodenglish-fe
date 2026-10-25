import { TENSE_FORMULA } from "@/const/grammar.constant";

// Rumus simbolik (+/−/?) untuk nama tense, dicocokkan longgar ('includes', huruf kecil).
export const formulaOf = (name: string) => {
  const n = name.toLowerCase();
  const f = TENSE_FORMULA.find(([k]) => n.includes(k));
  return f ? f[1] : null;
};
