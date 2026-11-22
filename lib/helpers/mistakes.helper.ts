import { categoryId } from "@/const/mistake-categories.constant";
import { GAPS } from "@/const/srs.constant";
import { ruleId } from "@/lib/helpers/cheat-rules.helper";
import { nextSrs, type SrsAnswer } from "@/lib/helpers/srs.helper";
import type {
  MistakeData,
  MistakeInput,
  MistakeRecord,
  MistakeSource,
  MistakeStatus,
} from "@/lib/types/mistake.types";
import type { LevelId } from "@/lib/types/session.types";

// "Buku kesalahanku" rules, pure (the store wraps them): one record per
// pattern, the review schedule, and reading old or imported data.

export const MISTAKES_MAX = 500;
/** New mistake cards a day in Ulang, so the queue never floods. */
export const NEW_MISTAKES_PER_DAY = 10;
/** Mastered: "Ingat" this many times in a row, the last gap at least… */
export const MASTER_STREAK = 3;
export const MASTER_GAP = 21;

export const EMPTY_MISTAKES: MistakeData = {
  v: 2,
  items: [],
  reviewOn: true,
  intro: { day: 0, n: 0 },
};

/** For comparing sentences: case, punctuation and spacing don't matter. */
export const normSentence = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’`]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const patternKey = (wrong: string, correct: string) =>
  `${normSentence(wrong)}→${normSentence(correct)}`;

const clean = (s: unknown, max: number) =>
  typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, max) : "";

const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const newSrs = (T: number) => ({
  st: 0,
  due: T + 1,
  streak: 0,
  lastGap: 0,
  reps: 0,
});

/** A record for a new mistake, or null when there is nothing to learn. */
export const makeMistake = (
  input: MistakeInput,
  now: string,
  T: number,
): MistakeRecord | null => {
  const wrong = clean(input.wrong, 600);
  const correct = clean(input.correct, 600);
  if (!wrong || !correct) return null;
  if (normSentence(wrong) === normSentence(correct)) return null;
  return {
    id: uid(),
    key: patternKey(wrong, correct),
    source: input.source,
    wrong,
    correct,
    explanation_id: clean(input.explanation_id, 400),
    category: categoryId(input.category),
    ...(ruleId(input.rule) ? { rule: ruleId(input.rule) } : {}),
    level: input.level,
    ...(input.refId ? { refId: clean(input.refId, 200) } : {}),
    createdAt: now,
    lastAt: now,
    count: 1,
    status: "active",
    srs: newSrs(T),
  };
};

/**
 * Adds a mistake: the same pattern again only counts up (and comes back to
 * Ulang tomorrow if it was mastered or archived). Returns what happened.
 */
export const addTo = (
  data: MistakeData,
  input: MistakeInput,
  now: string,
  T: number,
): { data: MistakeData; result: "new" | "repeat" | null } => {
  const rec = makeMistake(input, now, T);
  if (!rec) return { data, result: null };
  const at = data.items.findIndex((m) => m.key === rec.key);
  if (at < 0) {
    return {
      data: { ...data, items: cap([rec, ...data.items]) },
      result: "new",
    };
  }
  const cur = data.items[at];
  const back = cur.status !== "active";
  const next: MistakeRecord = {
    ...cur,
    count: cur.count + 1,
    lastAt: now,
    source: rec.source,
    explanation_id: rec.explanation_id || cur.explanation_id,
    ...(rec.rule || cur.rule ? { rule: rec.rule || cur.rule } : {}),
    ...(back ? { status: "active" as const, srs: newSrs(T) } : {}),
  };
  const items = [next, ...data.items.filter((_, k) => k !== at)];
  return { data: { ...data, items }, result: "repeat" };
};

/** Over the limit: drop mastered/archived ones first, oldest first. */
const cap = (items: MistakeRecord[]): MistakeRecord[] => {
  if (items.length <= MISTAKES_MAX) return items;
  const drop = [...items]
    .sort(
      (a, b) =>
        Number(a.status !== "active") - Number(b.status !== "active") ||
        b.lastAt.localeCompare(a.lastAt),
    )
    .slice(MISTAKES_MAX);
  const gone = new Set(drop.map((m) => m.id));
  return items.filter((m) => !gone.has(m.id));
};

const SOURCE_OF: Record<string, MistakeSource> = {
  // Dikte saved "Menyimak" before this list existed.
  Menyimak: "Dikte",
};
const STATUSES: MistakeStatus[] = ["active", "mastered", "archived"];
const num = (v: unknown, d: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : d;

/** One stored or imported record (any version), or null. */
const readRecord = (raw: unknown, T: number): MistakeRecord | null => {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const wrong = clean(m.wrong, 600);
  const correct = clean(m.correct, 600);
  if (!wrong || !correct) return null;
  const createdAt =
    typeof m.createdAt === "string" ? m.createdAt : new Date(0).toISOString();
  const srs = (m.srs ?? {}) as Record<string, unknown>;
  const source =
    typeof m.source === "string"
      ? (SOURCE_OF[m.source] ?? (m.source as MistakeSource))
      : "Tanya AI";
  return {
    id: typeof m.id === "string" ? m.id : uid(),
    key: patternKey(wrong, correct),
    source,
    wrong,
    correct,
    explanation_id: clean(m.explanation_id, 400),
    category: categoryId(m.category),
    ...(ruleId(m.rule) ? { rule: ruleId(m.rule) } : {}),
    level: (typeof m.level === "string" ? m.level : "pre") as LevelId,
    ...(typeof m.refId === "string" ? { refId: m.refId } : {}),
    createdAt,
    lastAt: typeof m.lastAt === "string" ? m.lastAt : createdAt,
    count: Math.max(1, num(m.count, 1)),
    status: STATUSES.includes(m.status as MistakeStatus)
      ? (m.status as MistakeStatus)
      : "active",
    // Old records had no schedule: they come to Ulang from tomorrow.
    srs: m.srs
      ? {
          st: Math.min(GAPS.length - 1, Math.max(0, num(srs.st, 0))),
          due: num(srs.due, T + 1),
          streak: Math.max(0, num(srs.streak, 0)),
          lastGap: Math.max(0, num(srs.lastGap, 0)),
          reps: Math.max(0, num(srs.reps, 0)),
        }
      : newSrs(T),
  };
};

/** Two copies of one pattern: counts add up to the larger, the schedule and
 * status come from the copy changed last. */
const combine = (a: MistakeRecord, b: MistakeRecord): MistakeRecord => {
  const [newer, older] = a.lastAt >= b.lastAt ? [a, b] : [b, a];
  return {
    ...newer,
    id: older.createdAt <= newer.createdAt ? older.id : newer.id,
    createdAt:
      older.createdAt < newer.createdAt ? older.createdAt : newer.createdAt,
    count: Math.max(a.count, b.count),
  };
};

const byPattern = (lists: MistakeRecord[][]): MistakeRecord[] => {
  const m = new Map<string, MistakeRecord>();
  lists.flat().forEach((r) => {
    const cur = m.get(r.key);
    m.set(r.key, cur ? combine(cur, r) : r);
  });
  return cap([...m.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt)));
};

/** Stored or imported data: the old array (Main peran, Dikte) or v2. */
export const normalizeMistakes = (raw: unknown, T: number): MistakeData => {
  const obj =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Partial<MistakeData>)
      : null;
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray(obj?.items)
      ? obj.items
      : [];
  const items = byPattern([
    list
      .map((r) => readRecord(r, T))
      .filter((r): r is MistakeRecord => r !== null),
  ]);
  const intro = obj?.intro;
  return {
    v: 2,
    items,
    reviewOn: obj?.reviewOn !== false,
    intro:
      intro && typeof intro.day === "number" && typeof intro.n === "number"
        ? { day: intro.day, n: intro.n }
        : { day: 0, n: 0 },
  };
};

/** Import: combine by pattern; the settings of this device stay. */
export const mergeMistakeData = (
  cur: MistakeData,
  incoming: unknown,
  T: number,
): MistakeData => ({
  ...cur,
  items: byPattern([cur.items, normalizeMistakes(incoming, T).items]),
});

const newToday = (d: MistakeData, T: number) =>
  d.intro.day === T ? d.intro.n : 0;

/** Mistake cards for Ulang today: reviews first, then up to the day's new
 * cards. Empty when "Sertakan kartu kesalahan" is off. */
export const dueMistakesOf = (d: MistakeData, T: number): MistakeRecord[] => {
  if (!d.reviewOn) return [];
  const due = d.items
    .filter((m) => m.status === "active" && m.srs.due <= T)
    .sort((a, b) => a.srs.due - b.srs.due || a.lastAt.localeCompare(b.lastAt));
  const reviews = due.filter((m) => m.srs.reps > 0);
  const fresh = due
    .filter((m) => m.srs.reps === 0)
    .slice(0, Math.max(0, NEW_MISTAKES_PER_DAY - newToday(d, T)));
  return [...reviews, ...fresh];
};

/** Answer a mistake card in Ulang (same steps as word cards). */
export const gradeIn = (
  d: MistakeData,
  id: string,
  how: SrsAnswer,
  T: number,
  now: string,
): MistakeData => {
  const m = d.items.find((x) => x.id === id);
  if (!m) return d;
  const next = nextSrs({ st: m.srs.st, due: m.srs.due }, how, T);
  const streak = how === "good" ? m.srs.streak + 1 : 0;
  const mastered = streak >= MASTER_STREAK && next.gap >= MASTER_GAP;
  const rec: MistakeRecord = {
    ...m,
    lastAt: now,
    status: mastered ? "mastered" : m.status,
    srs: {
      st: next.st,
      due: next.due,
      streak,
      lastGap: next.gap,
      reps: m.srs.reps + 1,
    },
  };
  return {
    ...d,
    items: d.items.map((x) => (x.id === id ? rec : x)),
    intro: m.srs.reps === 0 ? { day: T, n: newToday(d, T) + 1 } : d.intro,
  };
};

/** Archive, or bring back to Ulang (from tomorrow). */
export const setStatusIn = (
  d: MistakeData,
  id: string,
  status: MistakeStatus,
  T: number,
  now: string,
): MistakeData => ({
  ...d,
  items: d.items.map((m) =>
    m.id !== id
      ? m
      : {
          ...m,
          status,
          lastAt: now,
          ...(status === "active" && m.status !== "active"
            ? { srs: newSrs(T) }
            : {}),
        },
  ),
});
