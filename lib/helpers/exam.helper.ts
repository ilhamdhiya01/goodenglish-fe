import { LEVELS } from "@/const/levels.constant";
import type { ExamAttempt, ExamData } from "@/lib/types/exam.types";
import type { LevelId } from "@/lib/types/session.types";

// When the end-of-level exam opens, the 24-hour wait after a failed
// attempt, and which levels "Wajib lulus ujian" lets the learner pick.

export const EXAM_OPEN_KNOWN = 0.8;
export const EXAM_RETRY_MS = 24 * 60 * 60 * 1000;
export const ATTEMPTS_MAX = 100;

export const EMPTY_EXAM: ExamData = {
  placement: null,
  attempts: [],
  base: null,
};

const ORDER = LEVELS.map((l) => l[0] as LevelId);
export const levelIndex = (l: string) => ORDER.indexOf(l as LevelId);

/** Open at ≥ 80% of the level's words memorised, or in its last week. */
export const examOpen = (o: {
  known: number;
  total: number;
  week: number;
  lastWeek: number;
}) =>
  (o.total > 0 && o.known / o.total >= EXAM_OPEN_KNOWN) ||
  (o.lastWeek > 0 && o.week >= o.lastWeek);

export const attemptsOf = (d: ExamData, level: string) =>
  d.attempts
    .filter((a) => a.level === level)
    .sort((a, b) => b.date.localeCompare(a.date));

export const passedAttempt = (
  d: ExamData,
  level: string,
): ExamAttempt | undefined => attemptsOf(d, level).find((a) => a.passed);

/** Milliseconds until the exam of this level may be taken again (0 = now). */
export const retryIn = (d: ExamData, level: string, now = Date.now()) => {
  if (passedAttempt(d, level)) return 0;
  const last = attemptsOf(d, level)[0];
  if (!last) return 0;
  return Math.max(0, new Date(last.date).getTime() + EXAM_RETRY_MS - now);
};

/** The level after this one in the course, if any. */
export const nextLevel = (level: string): LevelId | null =>
  ORDER[levelIndex(level) + 1] ?? null;

/**
 * Levels the learner may pick. Without "Wajib lulus ujian": all the token
 * allows. With it: up to the level they started at, or one past the
 * highest level whose exam they passed.
 */
export const unlockedLevels = (o: {
  allowed: LevelId[];
  requireExam: boolean;
  exam: ExamData;
  current: LevelId;
}): LevelId[] => {
  if (!o.requireExam) return o.allowed;
  const passed = o.exam.attempts
    .filter((a) => a.passed)
    .map((a) => levelIndex(a.level));
  const start = levelIndex(o.exam.base ?? o.current);
  const top = Math.max(start, ...passed.map((i) => i + 1));
  return o.allowed.filter((l) => levelIndex(l) <= top);
};

const validAttempt = (a: unknown): a is ExamAttempt => {
  const x = a as Partial<ExamAttempt> | null;
  return (
    !!x &&
    typeof x.id === "string" &&
    typeof x.level === "string" &&
    typeof x.date === "string" &&
    typeof x.pct === "number" &&
    typeof x.passed === "boolean" &&
    !!x.sections &&
    typeof x.sections === "object"
  );
};

export const normalizeExam = (raw: unknown): ExamData => {
  const d =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Partial<ExamData>)
      : {};
  const p = d.placement;
  return {
    placement:
      p &&
      typeof p === "object" &&
      (p.status === "done" || p.status === "skipped") &&
      typeof p.date === "string"
        ? p
        : null,
    attempts: Array.isArray(d.attempts)
      ? d.attempts.filter(validAttempt).slice(0, ATTEMPTS_MAX)
      : [],
    base: levelIndex(d.base ?? "") >= 0 ? (d.base as LevelId) : null,
  };
};

/** Import: attempts by id, the newer placement, this device's start level. */
export const mergeExam = (cur: ExamData, incoming: unknown): ExamData => {
  const inc = normalizeExam(incoming);
  const have = new Set(cur.attempts.map((a) => a.id));
  const attempts = [
    ...cur.attempts,
    ...inc.attempts.filter((a) => !have.has(a.id)),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, ATTEMPTS_MAX);
  const placement =
    !cur.placement || (inc.placement && inc.placement.date > cur.placement.date)
      ? (inc.placement ?? cur.placement)
      : cur.placement;
  return { placement, attempts, base: cur.base ?? inc.base };
};
