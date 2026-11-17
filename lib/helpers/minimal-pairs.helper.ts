import { VOCAB_PRON } from "@/lib/content";
import { mulberry, shuffle } from "@/lib/helpers/bank-practice.helper";

// "Menyimak › Bunyi mirip": minimal pairs from Pelafalan › Bunyi sulit.
// Only pairs of two real words are quizzed: the data also lists
// mispronunciations ("tink ✗", "werk") as contrasts, which are not words
// a learner should pick. A few pairs are rude words and are left out.

export interface SoundPair {
  /** Stable id for stats: "<sound>|<a>|<b>". */
  id: string;
  a: string;
  b: string;
}

export interface SoundGroup {
  /** The sound's name in Pelafalan ("th", "v · f"), also its stats key. */
  name: string;
  sym: string;
  pairs: SoundPair[];
}

export interface PairQuestion {
  pair: SoundPair;
  sound: string;
  /** The word that is played. */
  answer: string;
  options: [string, string];
}

const NOT_WORDS = new Set(["werk", "hur", "furst", "wurld", "gurl"]);
const RUDE = new Set(["shit", "bitch", "piss"]);

const realWord = (w: string) =>
  /^[a-z]+$/i.test(w) &&
  !NOT_WORDS.has(w.toLowerCase()) &&
  !RUDE.has(w.toLowerCase());

/** Usable sound groups, each with only real-word, polite pairs. */
export const soundGroups = (): SoundGroup[] =>
  (
    (VOCAB_PRON?.sounds ?? []) as {
      name: string;
      sym: string;
      pairs: [string, string][];
      wordPairs?: [string, string][];
    }[]
  )
    .map((s) => {
      const seen = new Set<string>();
      const pairs = [...s.pairs, ...(s.wordPairs ?? [])]
        .filter(([a, b]) => realWord(a) && realWord(b))
        .filter(([a, b]) => {
          const k = `${a}|${b}`.toLowerCase();
          return !seen.has(k) && (seen.add(k), true);
        })
        .map(([a, b]) => ({ id: `${s.name}|${a}|${b}`, a, b }));
      return { name: s.name, sym: s.sym, pairs };
    })
    .filter((g) => g.pairs.length > 0);

/** Sentence the word is played in ("Say ship again."); stage 3 plays the word alone. */
export const carrierText = (word: string, stage: number) =>
  stage >= 3 ? word : `Say ${word} again.`;

/** Speed per stage: Agak pelan, then Normal. */
export const PAIR_SPEED: Record<number, number> = { 1: 0.78, 2: 0.95, 3: 0.95 };

/**
 * `n` questions spread over every sound (round-robin), each playing one word
 * of a pair; options in random order. Deterministic for a seed.
 */
export const buildPairQuestions = (
  groups: SoundGroup[],
  n = 20,
  seed = 1,
): PairQuestion[] => {
  const r = mulberry(seed || 1);
  const pools = groups.map((g) => ({ g, pairs: shuffle(r, g.pairs) }));
  const order = shuffle(r, pools);
  const out: PairQuestion[] = [];
  for (let i = 0; out.length < n && order.length; i++) {
    const { g, pairs } = order[i % order.length];
    const pair = pairs[Math.floor(i / order.length) % pairs.length];
    const answer = r() < 0.5 ? pair.a : pair.b;
    out.push({
      pair,
      sound: g.name,
      answer,
      options: r() < 0.5 ? [pair.a, pair.b] : [pair.b, pair.a],
    });
  }
  return out;
};

export interface SoundResult {
  sound: string;
  sym: string;
  right: number;
  total: number;
  /** Below 70%: show "perlu latihan" with a link to Pelafalan. */
  needsWork: boolean;
}

/** Results of a set grouped per sound, weakest first. */
export const resultsBySound = (
  groups: SoundGroup[],
  answers: { sound: string; right: boolean }[],
): SoundResult[] =>
  groups
    .map((g) => {
      const mine = answers.filter((a) => a.sound === g.name);
      const right = mine.filter((a) => a.right).length;
      return {
        sound: g.name,
        sym: g.sym,
        right,
        total: mine.length,
        needsWork: mine.length > 0 && right / mine.length < 0.7,
      };
    })
    .filter((s) => s.total > 0)
    .sort((a, b) => a.right / a.total - b.right / b.total);
