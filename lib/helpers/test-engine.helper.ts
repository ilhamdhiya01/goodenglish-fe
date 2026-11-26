import {
  type PracticeTopic,
  setsForLevel,
} from "@/const/practice-sets.constant";
import { VOCAB_SCEN } from "@/lib/content";
import {
  mulberry,
  type PracticeGen,
  shuffle,
} from "@/lib/helpers/bank-practice.helper";
import { checkDictation } from "@/lib/helpers/dictation.helper";
import { flatten, type LevelData } from "@/lib/helpers/level-data.helper";
import { pickListeningQuestions } from "@/lib/helpers/listening.helper";
import type { PracticeStage } from "@/lib/types/ask-practice.types";
import type {
  SectionId,
  SectionScores,
  TestAnswer,
  TestQuestion,
} from "@/lib/types/exam.types";
import type { ListeningItem } from "@/lib/types/listening.types";
import type { Scenario } from "@/lib/types/scenario.types";
import type { LevelId } from "@/lib/types/session.types";
import type { Item } from "@/lib/types/vocab.types";

// The test engine behind Tes penempatan and Ujian akhir level: picks
// questions per level from existing content (deterministic for a seed),
// grades answers and scores the sections. No UI, no stores.

/** Placement: go up a level at ≥ 70%; start mid-level at ≥ 90%. */
export const PLACEMENT_PASS = 0.7;
export const PLACEMENT_MID = 0.9;
/** Exam: ≥ 75% in total and ≥ 60% in every section. */
export const EXAM_PASS_TOTAL = 0.75;
export const EXAM_PASS_SECTION = 0.6;
/** A dictation sentence counts as right at ≥ 80% of its words. */
export const DICTATION_PASS = 80;

export type VocabKind = "vocab-mc" | "vocab-rev" | "vocab-type";

const low = (s: string) => s.trim().toLowerCase();

/** "look after (sb)" → "look after"; "a / b" → both. */
export const typedAnswers = (en: string): string[] =>
  en
    .split(/\s+\/\s+/)
    .map((x) => normWord(x.replace(/\([^)]*\)/g, " ")))
    .filter(Boolean);

export const normWord = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’`]/g, "'")
    .replace(/[^a-z0-9' -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Words that make a fair question: a short meaning that doesn't give the
// answer away, and no "sb/sth/…" placeholders.
const usable = (it: Item) =>
  !!it[3] &&
  it[3].length < 48 &&
  low(it[3]) !== low(it[1]) &&
  !/…|\.\.\.|\b(sb|sth|someone|something)\b/i.test(it[1]);

// To type it, it should be short and single-form.
const typable = (it: Item) =>
  it[1].length <= 24 && !/[()]/.test(it[1]) && !/[?!]/.test(it[1]);

export const vocabQuestions = (
  data: LevelData,
  level: LevelId,
  kinds: VocabKind[],
  seed: number,
): TestQuestion[] => {
  const r = mulberry(seed || 1);
  const seen = new Set<string>();
  const pool = shuffle(
    r,
    flatten(data.V)
      .map((x) => x.it)
      .filter(usable),
  ).filter((it) => {
    const k = low(it[1]);
    return !seen.has(k) && (seen.add(k), true);
  });
  const used = new Set<string>();
  const take = (ok: (it: Item) => boolean) => {
    const it = pool.find((x) => !used.has(x[1]) && ok(x));
    if (it) used.add(it[1]);
    return it;
  };
  // A word with the same meaning ("mulai": start, begin) would be a second
  // right answer, so it is never a distractor.
  const base = (it: Item) => low(it[3].replace(/\([^)]*\)/g, ""));
  const others = (it: Item, field: 1 | 3) => {
    const have = new Set([low(it[field])]);
    return shuffle(
      r,
      pool.filter((x) => x !== it && base(x) !== base(it)),
    )
      .map((x) => x[field])
      .filter((v) => {
        const k = low(v);
        return !have.has(k) && (have.add(k), true);
      })
      .slice(0, 3);
  };
  return kinds.flatMap((kind, i): TestQuestion[] => {
    const it = take(kind === "vocab-type" ? typable : () => true);
    if (!it) return [];
    const base = {
      id: `v:${level}:${i}:${it[1]}`,
      level,
      section: "vocab" as const,
      word: it[1],
      meaning: it[3],
    };
    if (kind === "vocab-type")
      return [{ ...base, kind, prompt: it[3], answer: it[1] }];
    const field = kind === "vocab-mc" ? 3 : 1;
    return [
      {
        ...base,
        kind,
        prompt: kind === "vocab-mc" ? it[1] : it[3],
        answer: it[field],
        options: shuffle(r, [it[field], ...others(it, field)]),
      },
    ];
  });
};

/** Grammar questions of a level, one per stage given, spread over the
 * level's practice sets. `gens` holds the loaded bank of each topic. */
export const grammarQuestions = (
  gens: Partial<Record<PracticeTopic, PracticeGen>>,
  level: LevelId,
  stages: PracticeStage[],
  seed: number,
): TestQuestion[] => {
  const r = mulberry(seed || 1);
  const sets = shuffle(
    r,
    setsForLevel(level).filter(([t]) => gens[t]),
  );
  if (!sets.length) return [];
  const seen = new Set<string>();
  return stages.flatMap((stage, i): TestQuestion[] => {
    for (let k = 0; k < sets.length; k++) {
      const [topic, set] = sets[(i + k) % sets.length];
      const q = gens[topic]!.make(set, 3, seed + i * 31 + k, {}).find(
        (x) => !seen.has(x.ans),
      );
      if (!q) continue;
      seen.add(q.ans);
      return [
        {
          id: `g:${level}:${i}:${set}`,
          level,
          section: "grammar",
          kind: "grammar",
          topic,
          set,
          stage,
          q,
        },
      ];
    }
    return [];
  });
};

/** Dictation sentences and "Dengar & jawab" questions of a level. When
 * there are fewer listen questions than wanted, dictation makes up the rest. */
export const listeningQuestions = (
  data: LevelData,
  level: LevelId,
  items: ListeningItem[],
  dictation: number,
  listen: number,
  seed: number,
): TestQuestion[] => {
  const mine = items.filter((x) => x.level === level);
  const picked = pickListeningQuestions({
    data,
    scenarios: VOCAB_SCEN as Scenario[],
    level,
    items: mine,
    dictation: dictation + listen,
    listen: listen,
    seed,
  });
  const listenQs = picked.items
    .flatMap((item) =>
      item.questions.map((question, qi) => ({ item, question, qi })),
    )
    .slice(0, listen)
    .map(({ item, question, qi }): TestQuestion => ({
      id: `l:${item.id}:${qi}`,
      level,
      section: "listening",
      kind: "listen",
      title: item.title,
      dialog: item.type === "dialog",
      lines: item.lines,
      question,
    }));
  const dictQs = picked.dictation
    .slice(0, dictation + (listen - listenQs.length))
    .map((sentence): TestQuestion => ({
      id: `d:${level}:${sentence.id}`,
      level,
      section: "listening",
      kind: "dictation",
      sentence,
    }));
  return [...dictQs, ...listenQs];
};

/** Whether an answer is right. Grammar needs the topic's loaded bank. */
export const isRight = (
  q: TestQuestion,
  a: TestAnswer,
  gens: Partial<Record<PracticeTopic, PracticeGen>>,
): boolean => {
  if (a === null || a === "") return false;
  switch (q.kind) {
    case "vocab-mc":
    case "vocab-rev":
      return a === q.answer;
    case "vocab-type":
      return typedAnswers(q.answer).includes(normWord(String(a)));
    case "grammar": {
      const g = gens[q.topic];
      if (q.stage === "mc") return a === q.q.ans;
      return g?.check
        ? g.check(String(a), q.q, q.stage)
        : !!g && g.norm(String(a)) === g.norm(q.q.ans);
    }
    case "dictation":
      return checkDictation(q.sentence.text, String(a)).score >= DICTATION_PASS;
    case "listen":
      return a === q.question.answerIndex;
  }
};

export const scoreSections = (
  qs: TestQuestion[],
  answers: TestAnswer[],
  gens: Partial<Record<PracticeTopic, PracticeGen>>,
): SectionScores => {
  const out: SectionScores = {};
  qs.forEach((q, i) => {
    const s = (out[q.section] ??= { right: 0, total: 0 });
    s.total++;
    if (isRight(q, answers[i] ?? null, gens)) s.right++;
  });
  return out;
};

export const totalOf = (s: SectionScores) =>
  Object.values(s).reduce(
    (t, x) => ({ right: t.right + x.right, total: t.total + x.total }),
    { right: 0, total: 0 },
  );

export const pctOf = (x: { right: number; total: number }) =>
  x.total ? Math.round((x.right / x.total) * 100) : 0;

// ---- Tes penempatan ------------------------------------------------------

/** Per level: 4 vocab + 4 grammar + 2 listening (1 dictation + 1 listen). */
export const PLACEMENT_VOCAB: VocabKind[] = [
  "vocab-mc",
  "vocab-rev",
  "vocab-type",
  "vocab-mc",
];
export const PLACEMENT_GRAMMAR: PracticeStage[] = ["mc", "order", "type", "mc"];

export const placementQuestions = (opts: {
  data: LevelData;
  level: LevelId;
  gens: Partial<Record<PracticeTopic, PracticeGen>>;
  items: ListeningItem[];
  seed: number;
}): TestQuestion[] => [
  ...vocabQuestions(opts.data, opts.level, PLACEMENT_VOCAB, opts.seed),
  ...grammarQuestions(opts.gens, opts.level, PLACEMENT_GRAMMAR, opts.seed + 7),
  ...listeningQuestions(
    opts.data,
    opts.level,
    opts.items,
    1,
    1,
    opts.seed + 13,
  ),
];

/** After a level's questions: go on to the next allowed level? */
export const placementGoesUp = (s: SectionScores) => {
  const t = totalOf(s);
  return t.total > 0 && t.right / t.total >= PLACEMENT_PASS;
};

/**
 * The recommendation: the highest level passed at ≥ 70% (only levels the
 * token allows, tried in order), week 1 — or the middle of the level at
 * ≥ 90%. Nothing passed: the lowest allowed level, week 1.
 */
export const recommendPlacement = (
  allowed: LevelId[],
  perLevel: Partial<Record<LevelId, SectionScores>>,
  weeksOf: (level: LevelId) => number,
): { level: LevelId; week: number } => {
  let best: LevelId | null = null;
  for (const lv of allowed) {
    const s = perLevel[lv];
    if (!s || !placementGoesUp(s)) break;
    best = lv;
  }
  if (!best) return { level: allowed[0], week: 1 };
  const t = totalOf(perLevel[best]!);
  const mid = t.right / t.total >= PLACEMENT_MID;
  return { level: best, week: mid ? Math.floor(weeksOf(best) / 2) + 1 : 1 };
};

// ---- Ujian akhir level ---------------------------------------------------

export const EXAM_VOCAB: VocabKind[] = [
  ...Array(5).fill("vocab-mc"),
  ...Array(5).fill("vocab-rev"),
  ...Array(5).fill("vocab-type"),
] as VocabKind[];
export const EXAM_GRAMMAR: PracticeStage[] = [
  ...Array(5).fill("mc"),
  ...Array(5).fill("order"),
  ...Array(5).fill("type"),
] as PracticeStage[];

/**
 * 40 questions: 15 vocab (5 typed), 15 grammar (5 of each stage), 10
 * listening (6 dictation + 4 listen). Without any listening content: 20
 * vocab + 20 grammar.
 */
export const examQuestions = (opts: {
  data: LevelData;
  level: LevelId;
  gens: Partial<Record<PracticeTopic, PracticeGen>>;
  items: ListeningItem[];
  seed: number;
}): TestQuestion[] => {
  const listening = listeningQuestions(
    opts.data,
    opts.level,
    opts.items,
    6,
    4,
    opts.seed + 13,
  );
  const extra = listening.length < 10;
  const vocabKinds: VocabKind[] = extra
    ? [
        ...EXAM_VOCAB,
        "vocab-mc",
        "vocab-mc",
        "vocab-rev",
        "vocab-rev",
        "vocab-type",
      ]
    : EXAM_VOCAB;
  const grammarStages: PracticeStage[] = extra
    ? [...EXAM_GRAMMAR, "mc", "mc", "order", "type", "type"]
    : EXAM_GRAMMAR;
  return [
    ...vocabQuestions(opts.data, opts.level, vocabKinds, opts.seed),
    ...grammarQuestions(opts.gens, opts.level, grammarStages, opts.seed + 7),
    ...(extra ? [] : listening),
  ];
};

export const examPassed = (s: SectionScores) => {
  const t = totalOf(s);
  if (!t.total || t.right / t.total < EXAM_PASS_TOTAL) return false;
  return Object.values(s).every(
    (x) => x.total === 0 || x.right / x.total >= EXAM_PASS_SECTION,
  );
};

export const sectionsBelow = (s: SectionScores): SectionId[] =>
  (Object.keys(s) as SectionId[]).filter(
    (k) => s[k]!.total && s[k]!.right / s[k]!.total < EXAM_PASS_SECTION,
  );
