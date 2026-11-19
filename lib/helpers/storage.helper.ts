import { PILOT } from "@/const/pilot.constant";
import { STORAGE_KEYS } from "@/const/storage-keys.constant";
import { queueProgress } from "@/lib/helpers/progress-sync.helper";
import type { ProgressKey, ProgressMap } from "@/lib/types/progress-sync.types";

// Same load/save API the stores always used, but learning progress now lives
// on the server (one document per former localStorage key, scoped to the
// access token). Reads come from the snapshot AppShell fetched before
// rendering; writes update the snapshot and are queued for PUT. Device-only
// preferences (the TTS voice) stay in localStorage.

const LEVEL_IDS = ["beginner", "pre", "inter", "upper"] as const;
const WEEK_PREFIX = "vocab-week-";

// localStorage key -> server document. `vocab-week-<level>` keys share one
// `weeks` document ({ [level]: "n" }), handled separately below.
const DOC_KEYS: Record<string, ProgressKey> = {
  [STORAGE_KEYS.known]: "known",
  [STORAGE_KEYS.srs]: "srs",
  [STORAGE_KEYS.own]: "own",
  [STORAGE_KEYS.custom]: "custom",
  [STORAGE_KEYS.done]: "done",
  [STORAGE_KEYS.level]: "level",
  [STORAGE_KEYS.askprac]: "askprac",
  [STORAGE_KEYS.plan]: "plan",
  [STORAGE_KEYS.practiceSession]: "practice_session",
  [STORAGE_KEYS.flip]: "flip",
  [STORAGE_KEYS.searchScope]: "search_scope",
  [STORAGE_KEYS.roleplay]: "roleplay",
  [STORAGE_KEYS.mistakes]: "mistakes",
  [STORAGE_KEYS.listening]: "listening",
  [STORAGE_KEYS.reading]: "reading",
  [STORAGE_KEYS.exam]: "exam",
  [STORAGE_KEYS.activity]: "activity",
};

let snapshot: ProgressMap = {};
// Bumped on every change, so a page can show the docs live (Progres).
let version = 0;
const listeners = new Set<() => void>();
const changed = () => {
  version++;
  listeners.forEach((l) => l());
};

export const setProgressSnapshot = (map: ProgressMap) => {
  snapshot = { ...map };
  changed();
};

/** Replace one doc without saving it (a merged / refreshed server copy). */
export const setSnapshotDoc = (key: ProgressKey, value: unknown) => {
  snapshot = { ...snapshot, [key]: value };
  changed();
};

/** Every progress doc as it is now (read-only: write through save()). */
export const getProgressSnapshot = (): ProgressMap => snapshot;
export const snapshotVersion = () => version;
export const subscribeSnapshot = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

const weekLevel = (k: string) =>
  k.startsWith(WEEK_PREFIX) && k !== STORAGE_KEYS.weekLegacy
    ? k.slice(WEEK_PREFIX.length)
    : null;

const weeksDoc = () => (snapshot.weeks ?? {}) as Record<string, string>;

const localGet = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

const localSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* full / private mode — ignore */
  }
};

export const load = <T>(k: string, d: T): T => {
  const doc = DOC_KEYS[k];
  if (doc) return (snapshot[doc] as T | undefined) ?? d;
  try {
    const v = localGet(k);
    return v == null ? d : (JSON.parse(v) as T);
  } catch {
    return d;
  }
};

export const save = (k: string, v: unknown) => {
  const doc = DOC_KEYS[k];
  if (doc) {
    snapshot[doc] = v;
    queueProgress(doc, v);
    changed();
    return;
  }
  localSet(k, JSON.stringify(v));
};

export const loadStr = (k: string): string | null => {
  const doc = DOC_KEYS[k];
  if (doc) {
    const v = snapshot[doc];
    return v == null ? null : String(v);
  }
  const lvl = weekLevel(k);
  if (lvl) return weeksDoc()[lvl] ?? null;
  // The pre-levels "current week" key only ever existed in old localStorage.
  if (k === STORAGE_KEYS.weekLegacy) return null;
  return localGet(k);
};

export const saveStr = (k: string, v: string) => {
  const doc = DOC_KEYS[k];
  if (doc) {
    snapshot[doc] = v;
    queueProgress(doc, v);
    changed();
    return;
  }
  const lvl = weekLevel(k);
  if (lvl) {
    const weeks = { ...weeksDoc(), [lvl]: v };
    snapshot.weeks = weeks;
    queueProgress("weeks", weeks);
    changed();
    return;
  }
  localSet(k, v);
};

export const remove = (k: string) => {
  try {
    localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
};

// Progress saved by the old localStorage-only app on this browser, in server
// document shape — offered as a one-time import on first sign-in.
export const readLegacyProgress = (): ProgressMap => {
  const out: ProgressMap = {};
  for (const [k, doc] of Object.entries(DOC_KEYS)) {
    const raw = localGet(k);
    if (raw == null) continue;
    try {
      out[doc] = JSON.parse(raw);
    } catch {
      // level / flip / search scope were stored as bare strings
      out[doc] = raw;
    }
  }
  const weeks: Record<string, string> = {};
  for (const lvl of LEVEL_IDS) {
    const w = localGet(WEEK_PREFIX + lvl);
    if (w) weeks[lvl] = w;
  }
  const legacyWeek = localGet(STORAGE_KEYS.weekLegacy);
  if (legacyWeek && !weeks.pre) weeks.pre = legacyWeek;
  if (Object.keys(weeks).length) out.weeks = weeks;
  return out;
};

// Only real learning data counts as "has something worth importing".
export const hasLegacyProgress = (map: ProgressMap) =>
  (["known", "srs", "own", "custom", "plan", "askprac"] as const).some((k) => {
    const v = map[k];
    return Array.isArray(v)
      ? v.length > 0
      : !!v && typeof v === "object" && Object.keys(v).length > 0;
  });

// The learning day follows the token's time zone (default Asia/Jakarta), not
// UTC and not the device clock: a session at 06:00 WIB belongs to that day.
// Days are numbered like before (days since 1970-01-01), so a stored day
// number keeps meaning the same calendar date.
let timeZone: string = PILOT.defaultTimeZone;
const formatters = new Map<string, Intl.DateTimeFormat>();
const formatterOf = (tz: string) => {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    formatters.set(tz, f);
  }
  return f;
};

/** Use this time zone for "today" (from the session); invalid ones are ignored. */
export const setTimeZone = (tz: string | null | undefined) => {
  if (!tz) return;
  try {
    formatterOf(tz);
    timeZone = tz;
  } catch {
    /* unknown zone: keep the current one */
  }
};

export const currentTimeZone = () => timeZone;

/** Day number of a moment in a time zone (the token's by default). */
export const dayOf = (ms: number, tz: string = timeZone) => {
  const [y, m, d] = formatterOf(tz).format(ms).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
};

/** Day number of today — used by the SRS schedule, daily checklist and log. */
export const today = () => dayOf(Date.now());

/** Unique key of a word: the historical 'pre' level has no prefix. The type
 * segment separates same-spelled words of different types. */
export const itemKey = (
  level: string,
  w: number | string,
  type: string,
  en: string,
) => (level === "pre" ? "" : level + "|") + w + ":" + type + ":" + en;

export { STORAGE_KEYS };
