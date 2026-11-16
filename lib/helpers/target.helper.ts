import type { VerbForms } from "@/lib/helpers/verb-forms.helper";
import { formVariants } from "@/lib/helpers/verb-forms.helper";

// Where the card's word appears in its example sentence, so it can be marked:
// "run out of" → "We *ran out of* coffee". Tries the word itself, its V2/V3
// and -ing forms, and the regular -s / -es / -ed / -ing endings on the first
// word (phrasal verbs inflect there: "looks forward to").

const SUFFIXES = ["s", "es", "ed", "d", "ing"];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const targetCandidates = (en: string, f: VerbForms | null) => {
  const base = en.toLowerCase().trim();
  const [head, ...rest] = base.split(/\s+/);
  const tail = rest.length ? " " + rest.join(" ") : "";
  const firstForms = [
    ...formVariants(f).map((v) => v.split(/\s+/)[0]),
    ...(f?.ing ? [f.ing] : []),
    ...SUFFIXES.map((s) => head + s),
    // drop a final e before -ing / -ed ("make" → "making")
    ...(head.endsWith("e") ? [head.slice(0, -1) + "ing"] : []),
  ];
  const all = [
    base,
    ...formVariants(f),
    ...firstForms.map((w) => w + tail),
  ].filter(Boolean);
  // Longest first, so "ran out of" wins over "ran".
  return [...new Set(all)].sort((a, b) => b.length - a.length);
};

/** [start, end] of the first whole-word match in the sentence, or null.
 * One alternation regex per card (longest candidate first, so at the same
 * position "ran out of" wins over "ran"): cards render by the hundreds. */
export const findTarget = (
  sentence: string,
  en: string,
  f: VerbForms | null,
): [number, number] | null => {
  const alt = targetCandidates(en, f).map(escape).join("|");
  if (!alt) return null;
  const m = new RegExp(`(^|[^\\p{L}'])(${alt})(?![\\p{L}])`, "iu").exec(
    sentence,
  );
  if (!m) return null;
  const start = m.index + m[1].length;
  return [start, start + m[2].length];
};
