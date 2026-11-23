// "Menyimak › Dikte": checks what the learner typed against the sentence
// they heard, word by word. Both sides are normalised first so that
// spelling choices that sound the same are not mistakes: case, punctuation
// and spacing, contractions (I'm = I am, don't = do not, can't = cannot) and
// numbers (5 = five, 5:30 = five thirty, 10% = ten percent, 2nd = second).
// Then a word-level alignment (edit distance) marks each word as correct,
// wrong (with the right word), missing or extra.

/** One normalised word. `alts` are other spellings it may match ("'s" can be is or has). */
export interface Token {
  text: string;
  alts?: string[];
}

export type WordMark =
  | { kind: "correct"; word: string }
  | { kind: "wrong"; word: string; expected: string }
  | { kind: "missing"; expected: string }
  | { kind: "extra"; word: string };

export interface DictationCheck {
  marks: WordMark[];
  correct: number;
  total: number;
  /** 0–100, words right out of the sentence's words. */
  score: number;
}

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];
const ORDINAL: Record<string, string> = {
  one: "first",
  two: "second",
  three: "third",
  five: "fifth",
  eight: "eighth",
  nine: "ninth",
  twelve: "twelfth",
};

/** 0–999 999 in words ("twenty one", "one hundred five"). */
export const numberWords = (n: number): string => {
  if (!Number.isFinite(n) || n < 0) return String(n);
  if (n < 20) return ONES[n];
  if (n < 100)
    return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  if (n < 1000)
    return (
      ONES[Math.floor(n / 100)] +
      " hundred" +
      (n % 100 ? " " + numberWords(n % 100) : "")
    );
  if (n < 1_000_000)
    return (
      numberWords(Math.floor(n / 1000)) +
      " thousand" +
      (n % 1000 ? " " + numberWords(n % 1000) : "")
    );
  return String(n);
};

const ordinalWords = (n: number) => {
  const w = numberWords(n).split(" ");
  const last = w.pop()!;
  const ord =
    ORDINAL[last] ??
    (last.endsWith("y") ? last.slice(0, -1) + "ieth" : last + "th");
  return [...w, ord].join(" ");
};

/** "5:30" → "five thirty", "9:05" → "nine oh five", "6:00" → "six". */
const timeWords = (h: number, m: number) =>
  numberWords(h) +
  (m === 0 ? "" : m < 10 ? " oh " + numberWords(m) : " " + numberWords(m));

// Contractions → full words. Ambiguous endings keep both readings as alts.
const CONTRACTIONS: [RegExp, string][] = [
  [/\bwon't\b/g, "will not"],
  [/\bcan't\b/g, "can not"],
  [/\bcannot\b/g, "can not"],
  [/\bshan't\b/g, "shall not"],
  [/\bain't\b/g, "am not"],
  [/\blet's\b/g, "let us"],
  [/\bi'm\b/g, "i am"],
  [/n't\b/g, " not"],
  [/'re\b/g, " are"],
  [/'ve\b/g, " have"],
  [/'ll\b/g, " will"],
  [/'d\b/g, " _d"],
  [/'s\b/g, " _s"],
];
const AMBIGUOUS: Record<string, string[]> = {
  _s: ["is", "has", "_s"],
  _d: ["would", "had", "_d"],
};

/** Lower-cased, contraction- and number-normalised words. */
export const normalizeTokens = (text: string): Token[] => {
  let s = text
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\([^)]*\)/g, " ")
    // 10% → 10 percent, $5 → 5 dollars
    .replace(/(\d+(?:\.\d+)?)\s*%/g, "$1 percent")
    .replace(/\$(\d+(?:\.\d+)?)/g, "$1 dollars")
    // times before plain numbers
    .replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h, m) => timeWords(+h, +m))
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, (_, n) => ordinalWords(+n))
    .replace(/\b(\d{1,3}(?:,\d{3})+|\d+)\b/g, (n: string) =>
      numberWords(+n.replace(/,/g, "")),
    )
    .replace(/(\w)-(\w)/g, "$1 $2");
  for (const [re, out] of CONTRACTIONS) s = s.replace(re, out);
  return s
    .replace(/[^a-z0-9_\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (AMBIGUOUS[w] ? { text: w, alts: AMBIGUOUS[w] } : { text: w }));
};

const forms = (t: Token) => t.alts ?? [t.text];
const same = (a: Token, b: Token) => forms(a).some((f) => forms(b).includes(f));
// Show the readable form of "_s"/"_d" placeholders.
const show = (t: Token) => (t.alts ? t.alts[0] : t.text);

/** Word-level alignment (Levenshtein): substitutions are "wrong" words. */
export const alignWords = (expected: Token[], typed: Token[]): WordMark[] => {
  const n = expected.length;
  const m = typed.length;
  const d: number[][] = Array.from({ length: n + 1 }, (_, i) =>
    Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      d[i][j] = Math.min(
        d[i - 1][j - 1] + (same(expected[i - 1], typed[j - 1]) ? 0 : 1),
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
      );
  const out: WordMark[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      d[i][j] ===
        d[i - 1][j - 1] + (same(expected[i - 1], typed[j - 1]) ? 0 : 1)
    ) {
      const e = expected[i - 1];
      const t = typed[j - 1];
      out.push(
        same(e, t)
          ? { kind: "correct", word: show(e) }
          : { kind: "wrong", word: show(t), expected: show(e) },
      );
      i--;
      j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      out.push({ kind: "missing", expected: show(expected[i - 1]) });
      i--;
    } else {
      out.push({ kind: "extra", word: show(typed[j - 1]) });
      j--;
    }
  }
  return out.reverse();
};

/** A typed word card, letter by letter: the learner's text in runs, `bad`
 * where a letter differs from the answer or is extra, and "_" where a letter
 * of the answer is missing (case ignored; missing dots or spaces aren't). */
export const markLetters = (
  expected: string,
  typed: string,
): { t: string; bad: boolean }[] => {
  const letters = (s: string) => [...s.toLowerCase()].map((c) => ({ text: c }));
  const chars = [...typed];
  const out: { t: string; bad: boolean }[] = [];
  const add = (t: string, bad: boolean) => {
    const last = out[out.length - 1];
    if (last?.bad === bad) last.t += t;
    else out.push({ t, bad });
  };
  let j = 0;
  for (const m of alignWords(letters(expected), letters(typed))) {
    if (m.kind === "missing") {
      if (/[a-z0-9]/.test(m.expected)) add("_", true);
      continue;
    }
    add(chars[j++], m.kind !== "correct");
  }
  return out;
};

export const checkDictation = (
  sentence: string,
  typed: string,
): DictationCheck => {
  const expected = normalizeTokens(sentence);
  const marks = alignWords(expected, normalizeTokens(typed));
  const correct = marks.filter((m) => m.kind === "correct").length;
  const total = expected.length;
  return {
    marks,
    correct,
    total,
    score: total ? Math.round((correct / total) * 100) : 0,
  };
};

/** Short Indonesian note of what was misheard, for Buku kesalahanku. */
export const explainMarks = (marks: WordMark[]): string => {
  const parts: string[] = [];
  const wrong = marks.filter((m) => m.kind === "wrong");
  const missing = marks.filter((m) => m.kind === "missing");
  const extra = marks.filter((m) => m.kind === "extra");
  if (wrong.length)
    parts.push(
      "Salah dengar: " +
        wrong.map((m) => `"${m.word}" → "${m.expected}"`).join(", "),
    );
  if (missing.length)
    parts.push("Terlewat: " + missing.map((m) => `"${m.expected}"`).join(", "));
  if (extra.length)
    parts.push("Berlebih: " + extra.map((m) => `"${m.word}"`).join(", "));
  return parts.join(". ") + (parts.length ? "." : "");
};
