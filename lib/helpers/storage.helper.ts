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
};

let snapshot: ProgressMap = {};

export const setProgressSnapshot = (map: ProgressMap) => {
  snapshot = { ...map };
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
    return;
  }
  const lvl = weekLevel(k);
  if (lvl) {
    const weeks = { ...weeksDoc(), [lvl]: v };
    snapshot.weeks = weeks;
    queueProgress("weeks", weeks);
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

/** Epoch day number (ms / 86400000) — used by the SRS schedule & daily checklist. */
export const today = () => Math.floor(Date.now() / 86400000);

/** Unique key of a word: the historical 'pre' level has no prefix. The type
 * segment separates same-spelled words of different types. */
export const itemKey = (
  level: string,
  w: number | string,
  type: string,
  en: string,
) => (level === "pre" ? "" : level + "|") + w + ":" + type + ":" + en;

export { STORAGE_KEYS };
