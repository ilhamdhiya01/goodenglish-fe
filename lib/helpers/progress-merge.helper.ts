import {
  mergeActivity,
  normalizeActivity,
} from "@/lib/helpers/activity.helper";
import { mergeExam, normalizeExam } from "@/lib/helpers/exam.helper";
import {
  mergeMistakeData,
  normalizeMistakes,
} from "@/lib/helpers/mistakes.helper";
import type { ActivityData, ActivityDay } from "@/lib/types/activity.types";
import type { MistakeRecord } from "@/lib/types/mistake.types";
import type {
  PlanData,
  PlanQuizEntry,
  PlanTally,
} from "@/lib/types/plan.types";
import type { ProgressKey } from "@/lib/types/progress-sync.types";
import type { RoleplayRecord } from "@/lib/types/roleplay.types";
import type { CustomWord } from "@/lib/types/vocab.types";
import { mergeListening, normalizeListening } from "@/stores/useListeningStore";
import { mergeReading, normalizeReading } from "@/stores/useReadingStore";
import { mergeRoleplay } from "@/stores/useRoleplayStore";

// Three-way merge of one progress document when two devices (or tabs) saved
// it from the same starting point. `base` is the version both started from
// (undefined when unknown, e.g. a save left over from a closed tab), `mine`
// this device's value, `theirs` what the server holds now. Whatever only one
// side changed is kept; when both changed the same entry, a per-document
// rule decides; counters add up what each side did on top of the base.

type Rec<V> = Record<string, V>;

const same = (a: unknown, b: unknown) =>
  a === b || JSON.stringify(a) === JSON.stringify(b);

const obj = <V>(x: unknown): Rec<V> | undefined =>
  x && typeof x === "object" && !Array.isArray(x) ? (x as Rec<V>) : undefined;

/**
 * Per entry: unchanged on my side → theirs; unchanged on theirs → mine;
 * deleted on one side and edited on the other → the edit; both edited →
 * `both` (mine by default). A missing entry is a deletion.
 */
export const merge3Map = <V>(
  base: Rec<V> | undefined,
  mine: Rec<V> | undefined,
  theirs: Rec<V> | undefined,
  both: (m: V, t: V, b: V | undefined) => V = (m) => m,
): Rec<V> => {
  const keys = new Set([
    ...Object.keys(base ?? {}),
    ...Object.keys(mine ?? {}),
    ...Object.keys(theirs ?? {}),
  ]);
  const out: Rec<V> = {};
  for (const k of keys) {
    const b = base?.[k];
    const m = mine?.[k];
    const t = theirs?.[k];
    let v: V | undefined;
    if (same(m, b)) v = t;
    else if (same(t, b)) v = m;
    else if (m === undefined) v = t;
    else if (t === undefined) v = m;
    else v = both(m, t, b);
    if (v !== undefined) out[k] = v;
  }
  return out;
};

/** merge3Map for lists of records with a key; mine's order first. */
export const merge3List = <V>(
  base: V[] | undefined,
  mine: V[] | undefined,
  theirs: V[] | undefined,
  keyOf: (v: V) => string,
  both?: (m: V, t: V, b: V | undefined) => V,
): V[] => {
  const toMap = (l: V[] | undefined) => {
    const r: Rec<V> = {};
    (Array.isArray(l) ? l : []).forEach((v) => {
      if (v != null) r[keyOf(v)] = v;
    });
    return r;
  };
  const merged = merge3Map(toMap(base), toMap(mine), toMap(theirs), both);
  const order = [
    ...(Array.isArray(mine) ? mine : []),
    ...(Array.isArray(theirs) ? theirs : []),
  ]
    .filter((v) => v != null)
    .map(keyOf);
  const out: V[] = [];
  const seen = new Set<string>();
  for (const k of order) {
    if (seen.has(k) || !(k in merged)) continue;
    seen.add(k);
    out.push(merged[k]);
  }
  return out;
};

/** Plain value: mine unless I didn't change it. */
const scalar = <V>(base: V | undefined, mine: V, theirs: V) =>
  same(mine, base) ? theirs : mine;

/** What both sides added on top of the base (the larger one without base). */
export const addCount = (
  b: number | undefined,
  m: number | undefined,
  t: number | undefined,
  hasBase: boolean,
) => {
  const mm = m ?? 0;
  const tt = t ?? 0;
  if (!hasBase) return Math.max(mm, tt);
  return tt + Math.max(0, mm - (b ?? 0));
};

/** A per-day counter ({ day, n }): the later day wins, same day adds up. */
const dayCounter = <T extends { day?: number }>(
  b: T | undefined,
  m: T | undefined,
  t: T | undefined,
  fields: (keyof T)[],
): T | undefined => {
  if (!m) return t;
  if (!t) return m;
  if ((m.day ?? 0) !== (t.day ?? 0)) return (m.day ?? 0) > (t.day ?? 0) ? m : t;
  const hasBase = !!b && b.day === m.day;
  const out = { ...t, ...m } as T;
  for (const f of fields) {
    const v = addCount(
      hasBase ? (b![f] as number | undefined) : undefined,
      m[f] as number | undefined,
      t[f] as number | undefined,
      hasBase,
    );
    (out as Record<keyof T, unknown>)[f] = v || undefined;
    if (!v) delete (out as Record<keyof T, unknown>)[f];
  }
  return out;
};

const mergeTally = (
  b: PlanTally | undefined,
  m: PlanTally | undefined,
  t: PlanTally | undefined,
): PlanTally | undefined => {
  const out = dayCounter(b, m, t, ["known", "ask", "pron", "rev"]);
  if (out && m && t && m.day === t.day && (m.q1 || t.q1)) out.q1 = true;
  return out;
};

const quizKey = (q: PlanQuizEntry) =>
  [q.d, q.score, q.scope, q.level, q.week].join("|");

const mergePlan = (base: unknown, mine: unknown, theirs: unknown): PlanData => {
  const b = obj<unknown>(base) as PlanData | undefined;
  const m = (obj<unknown>(mine) ?? {}) as PlanData;
  const t = (obj<unknown>(theirs) ?? {}) as PlanData;
  const out: PlanData = { ...t, ...m };
  // Other fields (rule, pronIdx…): mine unless unchanged.
  for (const k of ["rule", "pronIdx"] as const) {
    const v = scalar(b?.[k], m[k], t[k]);
    if (v === undefined) delete out[k];
    else (out as Record<string, unknown>)[k] = v;
  }
  out.days = merge3Map(b?.days, m.days, t.days, (mv, tv, bv) =>
    merge3Map(bv, mv, tv, (x, y) => x || y),
  );
  out.week = merge3Map(b?.week, m.week, t.week, (mv, tv) => ({
    ...tv,
    ...mv,
  }));
  out.quiz = merge3List(b?.quiz, m.quiz, t.quiz, quizKey).sort(
    (x, y) => x.d - y.d,
  );
  const tally = mergeTally(b?.tally, m.tally, t.tally);
  if (tally) out.tally = tally;
  else delete out.tally;
  return out;
};

const mergeMistakes = (
  base: unknown,
  mine: unknown,
  theirs: unknown,
  T: number,
) => {
  const m = normalizeMistakes(mine, T);
  const t = normalizeMistakes(theirs, T);
  const b = base === undefined ? undefined : normalizeMistakes(base, T);
  const items = merge3List<MistakeRecord>(
    b?.items,
    m.items,
    t.items,
    (r) => r.key,
    (x, y) => (x.lastAt >= y.lastAt ? x : y),
  );
  // Same sort and cap as everywhere else.
  return mergeMistakeData(
    {
      ...m,
      reviewOn: scalar(b?.reviewOn, m.reviewOn, t.reviewOn),
      intro: dayCounter(b?.intro, m.intro, t.intro, ["n"]) ?? m.intro,
      items,
    },
    [],
    T,
  );
};

const mergeActivityDoc = (
  base: unknown,
  mine: unknown,
  theirs: unknown,
  T: number,
): ActivityData | unknown => {
  const m = normalizeActivity(mine, T);
  const t = normalizeActivity(theirs, T);
  if (!m) return theirs;
  if (!t) return m;
  const b = base === undefined ? null : normalizeActivity(base, T);
  const merged = mergeActivity(m, t, T);
  const days: Rec<ActivityDay> = { ...merged.days };
  for (const [k, md] of Object.entries(m.days)) {
    const td = t.days[k];
    if (!td || !days[k]) continue;
    const bd = b?.days[k];
    const hasBase = !!b;
    const add = (f: "r" | "g" | "l") =>
      addCount(bd?.[f], md[f], td[f], hasBase);
    const menus: Rec<number> = {};
    for (const menu of new Set([
      ...Object.keys(md.m ?? {}),
      ...Object.keys(td.m ?? {}),
    ])) {
      menus[menu] = addCount(
        bd?.m?.[menu],
        md.m?.[menu],
        td.m?.[menu],
        hasBase,
      );
    }
    const r = add("r");
    const g = add("g");
    const l = add("l");
    days[k] = {
      ...(Object.keys(menus).length ? { m: menus } : {}),
      ...(r ? { r } : {}),
      ...(g ? { g } : {}),
      ...(l ? { l } : {}),
    };
  }
  return { ...merged, days };
};

/**
 * The merged value of one progress document. `T` is today (for the
 * documents that prune by day).
 */
export const mergeProgressDoc = (
  key: ProgressKey,
  base: unknown,
  mine: unknown,
  theirs: unknown,
  T: number,
): unknown => {
  if (theirs === undefined || theirs === null) return mine;
  if (mine === undefined || mine === null) return theirs;
  switch (key) {
    case "known":
    case "own":
    case "weeks":
      return merge3Map(obj(base), obj(mine), obj(theirs));
    case "srs":
      // Answered on both devices: the later schedule.
      return merge3Map<{ due?: number }>(
        obj(base),
        obj(mine),
        obj(theirs),
        (m, t) => ((t.due ?? 0) > (m.due ?? 0) ? t : m),
      );
    case "askprac":
      // Practised the same pattern on both: the one further along.
      return merge3Map<{ seen?: number }>(
        obj(base),
        obj(mine),
        obj(theirs),
        (m, t) => ((t.seen ?? 0) > (m.seen ?? 0) ? t : m),
      );
    case "custom":
      return merge3List<CustomWord>(
        base as CustomWord[] | undefined,
        mine as CustomWord[],
        theirs as CustomWord[],
        (w) => w.key,
      );
    case "done":
      return dayCounter(
        obj<number>(base) as { day?: number; n?: number } | undefined,
        obj<number>(mine) as { day?: number; n?: number },
        obj<number>(theirs) as { day?: number; n?: number },
        ["n"],
      );
    case "plan":
      return mergePlan(base, mine, theirs);
    case "roleplay":
      return mergeRoleplay(
        merge3List<RoleplayRecord>(
          Array.isArray(base) ? base : undefined,
          Array.isArray(mine) ? mine : [],
          Array.isArray(theirs) ? theirs : [],
          (r) => r.id,
        ),
        [],
      );
    case "mistakes":
      return mergeMistakes(base, mine, theirs, T);
    case "listening": {
      const b = base === undefined ? undefined : normalizeListening(base);
      const m = normalizeListening(mine);
      const t = normalizeListening(theirs);
      return mergeListening(
        {
          results: merge3List(b?.results, m.results, t.results, (r) => r.id),
          // Stages only ever open: the higher one.
          stages: mergeListening(m, t).stages,
          seen: merge3Map(b?.seen, m.seen, t.seen),
          pairs: merge3Map(b?.pairs, m.pairs, t.pairs, (x, y) =>
            y.total > x.total ? y : x,
          ),
        },
        {},
      );
    }
    case "reading": {
      const b = base === undefined ? undefined : normalizeReading(base);
      const m = normalizeReading(mine);
      const t = normalizeReading(theirs);
      return mergeReading(
        {
          results: merge3List(b?.results, m.results, t.results, (r) => r.id),
          // Done on both: the first time.
          done: merge3Map(b?.done, m.done, t.done, (x, y) => (y < x ? y : x)),
          lookups: merge3Map(b?.lookups, m.lookups, t.lookups),
        },
        {},
      );
    }
    case "exam":
      // Attempts are only ever added; the later placement, the first base.
      return mergeExam(normalizeExam(mine), theirs);
    case "activity":
      return mergeActivityDoc(base, mine, theirs, T);
    default:
      // level, flip, search_scope, practice_session: a single choice.
      return scalar(base, mine, theirs);
  }
};
