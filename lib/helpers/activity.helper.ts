import type {
  ActivityData,
  ActivityDay,
  ActivityEvent,
} from "@/lib/types/activity.types";
import type { ProgressMap } from "@/lib/types/progress-sync.types";

// Rules of the activity log: adding to today, keeping it small, merging an
// import, and filling it once from older dated data.

export const EVENTS_DAYS = 90;
export const DAYS_KEPT = 400;
const DAY_MS = 86_400_000;

export const emptyActivity = (today: number): ActivityData => ({
  v: 1,
  since: today,
  days: {},
  events: [],
});

const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;
const obj = <T>(v: unknown, d: T): T =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as T) : d;

/** Older events and days dropped (events: their counts live on in days). */
export const prune = (d: ActivityData, today: number): ActivityData => {
  const minEv = (today - EVENTS_DAYS) * DAY_MS;
  const days: Record<string, ActivityDay> = {};
  Object.entries(d.days).forEach(([k, v]) => {
    if (+k > today - DAYS_KEPT) days[k] = v;
  });
  return { ...d, days, events: d.events.filter((e) => e.ts >= minEv) };
};

const withDay = (
  d: ActivityData,
  day: number,
  f: (cur: ActivityDay) => ActivityDay,
): ActivityData => ({
  ...d,
  days: { ...d.days, [day]: f(d.days[day] ?? {}) },
});

export const addSeconds = (
  d: ActivityData,
  day: number,
  menu: string,
  sec: number,
) =>
  sec <= 0
    ? d
    : withDay(d, day, (c) => ({
        ...c,
        m: { ...c.m, [menu]: (c.m?.[menu] ?? 0) + Math.round(sec) },
      }));

export const addReview = (d: ActivityData, day: number, good: boolean) =>
  withDay(d, day, (c) => ({
    ...c,
    r: (c.r ?? 0) + 1,
    g: (c.g ?? 0) + (good ? 1 : 0),
  }));

export const addLearned = (d: ActivityData, day: number, by: number) =>
  withDay(d, day, (c) => ({ ...c, l: (c.l ?? 0) + by }));

export const addEvent = (d: ActivityData, e: ActivityEvent) =>
  d.events.some((x) => x.id === e.id) ? d : { ...d, events: [...d.events, e] };

export const normalizeActivity = (
  raw: unknown,
  today: number,
): ActivityData | null => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Partial<ActivityData>;
  const days: Record<string, ActivityDay> = {};
  Object.entries(obj<Record<string, unknown>>(r.days, {})).forEach(([k, v]) => {
    if (!Number.isInteger(+k)) return;
    const x = obj<Record<string, unknown>>(v, {});
    const m: Record<string, number> = {};
    Object.entries(obj<Record<string, unknown>>(x.m, {})).forEach(
      ([menu, s]) => {
        if (num(s) > 0) m[menu] = num(s);
      },
    );
    days[k] = {
      ...(Object.keys(m).length ? { m } : {}),
      ...(num(x.r) ? { r: num(x.r) } : {}),
      ...(num(x.g) ? { g: num(x.g) } : {}),
      ...(num(x.l) ? { l: num(x.l) } : {}),
    };
  });
  const events = (Array.isArray(r.events) ? r.events : []).filter(
    (e): e is ActivityEvent =>
      !!e &&
      typeof e.id === "string" &&
      typeof e.type === "string" &&
      typeof e.ts === "number",
  );
  return {
    v: 1,
    since: Number.isInteger(r.since) ? (r.since as number) : today,
    days,
    events,
  };
};

/** Import: per day and menu the larger value; events by id. */
export const mergeActivity = (
  cur: ActivityData,
  incoming: unknown,
  today: number,
): ActivityData => {
  const inc = normalizeActivity(incoming, today);
  if (!inc) return cur;
  const days: Record<string, ActivityDay> = { ...inc.days };
  Object.entries(cur.days).forEach(([k, a]) => {
    const b = days[k];
    if (!b) {
      days[k] = a;
      return;
    }
    const m: Record<string, number> = { ...b.m };
    Object.entries(a.m ?? {}).forEach(([menu, s]) => {
      m[menu] = Math.max(s, m[menu] ?? 0);
    });
    const r = Math.max(a.r ?? 0, b.r ?? 0);
    const g = Math.max(a.g ?? 0, b.g ?? 0);
    const l = Math.max(a.l ?? 0, b.l ?? 0);
    days[k] = {
      ...(Object.keys(m).length ? { m } : {}),
      ...(r ? { r } : {}),
      ...(g ? { g } : {}),
      ...(l ? { l } : {}),
    };
  });
  const have = new Set(cur.events.map((e) => e.id));
  return prune(
    {
      v: 1,
      since: Math.min(cur.since, inc.since),
      days,
      events: [...cur.events, ...inc.events.filter((e) => !have.has(e.id))],
    },
    today,
  );
};

const isoMs = (v: unknown) => {
  const t = typeof v === "string" ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? t : null;
};

/**
 * The first log, filled from data that already had dates: quick tests,
 * Main peran (with its minutes), Menyimak and Bacaan sets, exams. Words
 * learned, reviews and minutes elsewhere start counting from today.
 */
export const backfillActivity = (
  map: ProgressMap,
  today: number,
): ActivityData => {
  let d = emptyActivity(today);
  const plan = obj<{ quiz?: unknown }>(map.plan, {});
  (Array.isArray(plan.quiz) ? plan.quiz : []).forEach((q, i) => {
    const x = obj<Record<string, unknown>>(q, {});
    if (!num(x.d)) return;
    d = addEvent(d, {
      id: `bq${x.d}-${i}`,
      type: "quick_test",
      ts: num(x.d) * DAY_MS + 12 * 3_600_000,
      meta: { score: num(x.score), total: 20, scope: String(x.scope ?? "") },
    });
  });
  (Array.isArray(map.roleplay) ? map.roleplay : []).forEach((r) => {
    const x = obj<Record<string, unknown>>(r, {});
    const ts = isoMs(x.startedAt);
    if (ts === null || typeof x.id !== "string") return;
    d = addEvent(d, {
      id: `br${x.id}`,
      type: "roleplay",
      ts,
      durationSec: num(x.durationSec),
    });
    d = addSeconds(d, Math.floor(ts / DAY_MS), "roleplay", num(x.durationSec));
  });
  const results = (doc: unknown, type: "listening_set" | "reading"): void => {
    const list = obj<{ results?: unknown }>(doc, {}).results;
    (Array.isArray(list) ? list : []).forEach((r) => {
      const x = obj<Record<string, unknown>>(r, {});
      const ts = isoMs(x.date);
      if (ts === null || typeof x.id !== "string") return;
      d = addEvent(d, {
        id: `b${type[0]}${x.id}`,
        type,
        ts,
        meta: { score: num(x.score), total: num(x.total) },
      });
    });
  };
  results(map.listening, "listening_set");
  results(map.reading, "reading");
  const exam = obj<{ attempts?: unknown }>(map.exam, {}).attempts;
  (Array.isArray(exam) ? exam : []).forEach((a) => {
    const x = obj<Record<string, unknown>>(a, {});
    const ts = isoMs(x.date);
    if (ts === null || typeof x.id !== "string") return;
    d = addEvent(d, {
      id: `be${x.id}`,
      type: "exam",
      ts,
      meta: {
        level: String(x.level ?? ""),
        pct: num(x.pct),
        passed: !!x.passed,
      },
    });
  });
  return prune(d, today);
};
