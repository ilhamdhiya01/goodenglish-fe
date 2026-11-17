import { VERB_FORMS } from "@/lib/content";

// Dictionary forms a word in running text may come from: "went" → go,
// "studies" → study, "making" → make, "stopped" → stop. No dictionary here:
// it lists candidates (the word itself first) and the caller keeps the ones
// that exist in Kosakata.

const clean = (s: string) =>
  s
    .replace(/\s*\/[^/]*\/\s*/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .trim()
    .toLowerCase();

let reverse: Map<string, string[]> | null = null;
// V2 / V3 / V-ing → base, from the irregular and special-spelling tables.
const reverseForms = () => {
  if (reverse) return reverse;
  const m = new Map<string, string[]>();
  const add = (form: string, base: string) =>
    form
      .split(/\s*\/\s*/)
      .map(clean)
      .filter((f) => f && f !== base)
      .forEach((f) => m.set(f, [...(m.get(f) ?? []), base]));
  Object.entries(VERB_FORMS.IRREG).forEach(([base, forms]) =>
    forms.forEach((f) => add(f, base)),
  );
  Object.entries(VERB_FORMS.SPELL).forEach(([base, forms]) =>
    forms.forEach((f) => add(f, base)),
  );
  reverse = m;
  return m;
};

const VOWEL = /[aeiou]/;

/** Candidate base forms, most likely first; always starts with the word. */
export const baseForms = (word: string): string[] => {
  const w = word
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/'s$|s'$/, (m) => (m === "s'" ? "s" : ""))
    .replace(/^[^a-z]+|[^a-z]+$/g, "");
  if (!w) return [];
  const out: string[] = [w, ...(reverseForms().get(w) ?? [])];
  const push = (s: string) => {
    if (s.length >= 2 && VOWEL.test(s)) out.push(s);
  };
  if (w.endsWith("ies") || w.endsWith("ied")) push(w.slice(0, -3) + "y");
  if (/(ches|shes|sses|xes|zes|oes)$/.test(w)) push(w.slice(0, -2));
  if (w.endsWith("s") && !w.endsWith("ss")) push(w.slice(0, -1));
  for (const suf of ["ed", "ing"]) {
    if (!w.endsWith(suf)) continue;
    const stem = w.slice(0, -suf.length);
    // stopped → stop, running → run
    if (/([bdgklmnprt])\1$/.test(stem)) push(stem.slice(0, -1));
    push(stem);
    push(stem + "e"); // making → make, liked → like
  }
  if (w.endsWith("ed")) push(w.slice(0, -1)); // used → use (after "us")
  if (w.endsWith("er")) push(w.slice(0, -2)); // faster → fast
  if (w.endsWith("est")) push(w.slice(0, -3));
  if (w.endsWith("ly")) push(w.slice(0, -2)); // quickly → quick
  return [...new Set(out)];
};
