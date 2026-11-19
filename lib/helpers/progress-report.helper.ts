import { LEVELS } from "@/const/levels.constant";
import { categoryOf, learnHref } from "@/const/mistake-categories.constant";
import { normalizeActivity } from "@/lib/helpers/activity.helper";
import { dueKeysOf } from "@/lib/helpers/derived.helper";
import { normalizeExam } from "@/lib/helpers/exam.helper";
import {
  dueMistakesOf,
  normalizeMistakes,
} from "@/lib/helpers/mistakes.helper";
import { quizPassed } from "@/lib/helpers/quiz-pass.helper";
import {
  blocksOn,
  mondayOf,
  type PlanDays,
  streakOf,
} from "@/lib/helpers/streak.helper";
import type { ActivityData } from "@/lib/types/activity.types";
import type { ExamAttempt, PlacementResult } from "@/lib/types/exam.types";
import { GRAMMAR_SUBS } from "@/lib/types/grammar.types";
import type { PlanData } from "@/lib/types/plan.types";
import type { SrsEntry } from "@/lib/types/progress.types";
import type { ProgressMap } from "@/lib/types/progress-sync.types";
import type { MenuId } from "@/lib/types/session.types";

// "Progres": everything the page shows, computed from the raw progress docs
// (the learner's own, or a learner's fetched by an admin). Pure.

export const WEEKS = 12;

export type SkillId =
  "vocab" | "grammar" | "listening" | "reading" | "speaking";

export const SKILLS: {
  id: SkillId;
  label: string;
  /** For "Minggu ini belum latihan …". */
  noun: string;
  menus: string[];
  href: string;
}[] = [
  {
    id: "vocab",
    label: "Kosakata",
    noun: "kosakata",
    menus: ["vocab", "review"],
    href: "/vocab",
  },
  {
    id: "grammar",
    label: "Grammar",
    noun: "grammar",
    menus: ["grammar", "errors", "cheatsheet"],
    href: "/grammar/tense",
  },
  {
    id: "listening",
    label: "Menyimak",
    noun: "menyimak",
    menus: ["listening"],
    href: "/listening/dikte",
  },
  {
    id: "reading",
    label: "Bacaan",
    noun: "membaca",
    menus: ["reading"],
    href: "/reading",
  },
  {
    id: "speaking",
    label: "Bicara",
    noun: "bicara",
    menus: ["roleplay", "pronunciation"],
    href: "/pronunciation",
  },
];

/** Practice topic (askprac key prefix) → Panduan grammar sub-tab. */
export const TOPIC_SUB: Record<string, string> = {
  whb: "been",
  irr: "irr",
  prep: "prep",
  bedo: "bedo",
  tense: "tense",
  thit: "thit",
  conj: "conj",
  r: "ask",
};
export const SUB_LABEL = new Map(
  GRAMMAR_SUBS.map((s) => [s.id as string, s.label]),
);
// Set ids are "<topic><n>"; Bertanya's rules are "r1".."r4".
const topicOf = (key: string) => key.replace(/\d+$/, "");

/** Accuracy needs this many answers to be shown. */
export const MIN_SEEN = 5;

export interface WeekPoint {
  /** Monday (epoch day). */
  week: number;
  value: number;
}

export interface FocusItem {
  title: string;
  reason: string;
  href: string;
  cta: string;
}

export interface ProgressReport {
  today: number;
  /** First day of the activity log (minutes, reviews, words), if any. */
  since: number | null;
  summary: {
    streak: number;
    minutes7d: number | null;
    known: number;
    dueToday: number;
  };
  /** Last 12 weeks (Monday first), blocks of Rencana done per day. */
  calendar: { day: number; blocks: number }[] | null;
  learned: WeekPoint[] | null;
  retention: { week: number; reviews: number; pct: number | null }[] | null;
  grammar: {
    topic: string;
    label: string;
    href: string;
    seen: number;
    pct: number;
  }[];
  focus: FocusItem[];
  skills: { id: SkillId; label: string; minutes: number }[] | null;
  skillNotes: string[];
  checkpoints: {
    level: string;
    week: number;
    quizBest: number | null;
    /** Questions of that best test (older entries: 20). */
    quizTotal: number | null;
    rec: boolean;
    roleplayMin: number;
    passed: boolean;
  }[];
  exams: ExamAttempt[];
  placement: PlacementResult | null;
}

const obj = <T>(v: unknown, d: T): T =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as T) : d;

const levelName = (id: string) =>
  (LEVELS.find((l) => l[0] === id) ?? [])[1] ?? id;

const weeksBack = (today: number) => {
  const m = mondayOf(today);
  return Array.from({ length: WEEKS }, (_, i) => m - (WEEKS - 1 - i) * 7);
};

const sumDays = (
  a: ActivityData,
  from: number,
  to: number,
  f: (d: NonNullable<ActivityData["days"][string]>) => number,
) => {
  let n = 0;
  for (let d = from; d <= to; d++) {
    const x = a.days[d];
    if (x) n += f(x);
  }
  return n;
};

const secOf = (x: { m?: Record<string, number> }, menus?: string[]) =>
  Object.entries(x.m ?? {}).reduce(
    (n, [menu, s]) => n + (!menus || menus.includes(menu) ? s : 0),
    0,
  );

export const buildProgressReport = (
  map: ProgressMap,
  opts: { today: number; menus?: MenuId[] },
): ProgressReport => {
  const T = opts.today;
  const plan = obj<PlanData>(map.plan, {});
  const days = (plan.days ?? {}) as PlanDays;
  const activity = normalizeActivity(map.activity, T);
  const known = obj<Record<string, 1>>(map.known, {});
  const srs = obj<Record<string, SrsEntry>>(map.srs, {});
  const mistakes = normalizeMistakes(map.mistakes ?? [], T);
  const can = (href: string) =>
    !opts.menus || opts.menus.includes(href.split("/")[1] as MenuId);

  // Unique words: the same word memorised in two levels counts once.
  const uniqueKnown = new Set(
    Object.keys(known).map((k) =>
      k
        .replace(/^[a-z]+\|/, "")
        .replace(/^\d+:/, "")
        .toLowerCase(),
    ),
  ).size;

  const weeks = weeksBack(T);
  const firstDay = weeks[0];

  const calendarDays = Array.from({ length: T - firstDay + 1 }, (_, i) => ({
    day: firstDay + i,
    blocks: Math.min(3, blocksOn(days, firstDay + i)),
  }));
  // No Rencana block in 12 weeks: nothing to colour.
  const calendar = calendarDays.some((d) => d.blocks) ? calendarDays : null;

  const learnedRows = activity
    ? weeks.map((w) => ({
        week: w,
        value: Math.max(
          0,
          sumDays(activity, w, Math.min(w + 6, T), (x) => x.l ?? 0),
        ),
      }))
    : null;

  // Nothing learned in 12 weeks: no chart of zeros.
  const learned = learnedRows?.some((w) => w.value) ? learnedRows : null;

  const retentionRows = activity
    ? weeks.map((w) => {
        const to = Math.min(w + 6, T);
        const reviews = sumDays(activity, w, to, (x) => x.r ?? 0);
        const good = sumDays(activity, w, to, (x) => x.g ?? 0);
        return {
          week: w,
          reviews,
          pct: reviews ? Math.round((good / reviews) * 100) : null,
        };
      })
    : null;
  const retention = retentionRows?.some((r) => r.reviews)
    ? retentionRows
    : null;

  // Grammar accuracy per topic (lifetime counters of the practice).
  const byTopic = new Map<string, { seen: number; right: number }>();
  Object.entries(
    obj<Record<string, { seen?: number; right?: number }>>(map.askprac, {}),
  ).forEach(([key, st]) => {
    const t = topicOf(key);
    if (!TOPIC_SUB[t]) return;
    const cur = byTopic.get(t) ?? { seen: 0, right: 0 };
    cur.seen += Number(st?.seen) || 0;
    cur.right += Number(st?.right) || 0;
    byTopic.set(t, cur);
  });
  const grammar = [...byTopic.entries()]
    .filter(([, v]) => v.seen >= MIN_SEEN)
    .map(([t, v]) => ({
      topic: t,
      label: SUB_LABEL.get(TOPIC_SUB[t]) ?? t,
      href: `/grammar/${TOPIC_SUB[t]}`,
      seen: v.seen,
      pct: Math.round((v.right / v.seen) * 100),
    }))
    .sort((a, b) => a.pct - b.pct || b.seen - a.seen);

  // Skill balance, last 7 days.
  const skillRows = activity
    ? SKILLS.map((s) => ({
        id: s.id,
        label: s.label,
        minutes: Math.round(
          sumDays(activity, T - 6, T, (x) => secOf(x, s.menus)) / 60,
        ),
      }))
    : null;
  // No minutes at all yet: the section is hidden (the focus list still
  // suggests a start).
  const skills = skillRows?.some((x) => x.minutes) ? skillRows : null;
  const fullWeek = !!activity && activity.since <= T - 6;
  const zeroSkills = fullWeek
    ? SKILLS.filter(
        (s) =>
          can(s.href) &&
          (skillRows!.find((x) => x.id === s.id)?.minutes ?? 0) < 1,
      )
    : [];
  const skillNotes = (skills ? zeroSkills : []).map(
    (s) => `Minggu ini belum latihan ${s.noun}.`,
  );

  // "Fokus minggu ini".
  const focus: FocusItem[] = [];
  const weakTopic = grammar.find((g) => g.seen >= 10 && g.pct < 80);
  if (weakTopic && can(weakTopic.href))
    focus.push({
      title: `Latih ${weakTopic.label}`,
      reason: `Akurasimu ${weakTopic.pct}% dari ${weakTopic.seen} soal, paling rendah di latihan grammar.`,
      href: weakTopic.href,
      cta: "Latih",
    });
  const cats = new Map<string, number>();
  mistakes.items
    .filter((m) => m.status === "active")
    .forEach((m) => cats.set(m.category, (cats.get(m.category) ?? 0) + 1));
  const topCat = [...cats.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCat && topCat[1] >= 2)
    focus.push({
      title: `Betulkan "${categoryOf(topCat[0]).label}"`,
      reason: `${topCat[1]} kesalahan aktif di kategori ini, terbanyak di Buku kesalahanku.`,
      href: learnHref(topCat[0]),
      cta: "Pelajari aturannya",
    });
  const sounds = new Map<string, { right: number; total: number }>();
  Object.entries(
    obj<Record<string, { right?: number; total?: number }>>(
      obj<{ pairs?: unknown }>(map.listening, {}).pairs,
      {},
    ),
  ).forEach(([id, p]) => {
    const sound = id.split("|")[0];
    const cur = sounds.get(sound) ?? { right: 0, total: 0 };
    cur.right += Number(p?.right) || 0;
    cur.total += Number(p?.total) || 0;
    sounds.set(sound, cur);
  });
  const weakSound = [...sounds.entries()]
    .filter(([, v]) => v.total >= 3 && v.right / v.total < 0.8)
    .sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total)[0];
  if (weakSound && can("/listening/bunyi"))
    focus.push({
      title: `Latih bunyi "${weakSound[0]}"`,
      reason: `Baru ${Math.round((weakSound[1].right / weakSound[1].total) * 100)}% benar dari ${weakSound[1].total} soal Bunyi mirip.`,
      href: "/listening/bunyi",
      cta: "Latih bunyi",
    });
  for (const s of zeroSkills) {
    if (focus.length >= 3) break;
    focus.push({
      title: `Coba latihan ${s.noun}`,
      reason: `Minggu ini belum ada menit latihan ${s.noun}.`,
      href: s.href,
      cta: `Buka ${s.label}`,
    });
  }

  // Weekly checkpoints (whatever was tried), newest level and week first.
  // Best by share of right answers.
  const quizBest = new Map<string, { score: number; total: number }>();
  (plan.quiz ?? []).forEach((q) => {
    if (q.scope !== "week") return;
    const k = `${q.level}|${q.week}`;
    const cur = quizBest.get(k);
    const total = q.total ?? 20;
    if (!cur || q.score / total > cur.score / cur.total)
      quizBest.set(k, { score: q.score, total });
  });
  const rpSec = new Map<string, number>();
  (Array.isArray(map.roleplay) ? map.roleplay : []).forEach((r) => {
    const x = obj<{ level?: string; week?: number; durationSec?: number }>(
      r,
      {},
    );
    if (!x.level || !x.week) return;
    const k = `${x.level}|${x.week}`;
    rpSec.set(k, (rpSec.get(k) ?? 0) + Math.max(0, Number(x.durationSec) || 0));
  });
  const keys = new Set([
    ...quizBest.keys(),
    ...rpSec.keys(),
    ...Object.keys(plan.week ?? {}),
  ]);
  const order = (k: string) => {
    const [lv, w] = k.split("|");
    return LEVELS.findIndex((l) => l[0] === lv) * 100 + Number(w);
  };
  const checkpoints = [...keys]
    .filter((k) => /^[a-z]+\|\d+$/.test(k))
    .sort((a, b) => order(b) - order(a))
    .map((k) => {
      const [level, w] = k.split("|");
      const wk = plan.week?.[k] ?? {};
      const best = quizBest.has(k) ? quizBest.get(k)! : null;
      const rp = Math.floor((rpSec.get(k) ?? 0) / 60);
      return {
        level,
        week: Number(w),
        quizBest: best?.score ?? null,
        quizTotal: best?.total ?? null,
        rec: !!wk.rec,
        roleplayMin: rp,
        passed:
          !!best &&
          quizPassed(best.score, best.total) &&
          !!wk.rec &&
          (rp >= 10 || !!wk.gpt),
      };
    });

  const exam = normalizeExam(map.exam);

  return {
    today: T,
    since: activity?.since ?? null,
    summary: {
      streak: streakOf(days, T),
      minutes7d: activity
        ? Math.round(sumDays(activity, T - 6, T, (x) => secOf(x)) / 60)
        : null,
      known: uniqueKnown,
      dueToday:
        dueKeysOf(srs, known).length + dueMistakesOf(mistakes, T).length,
    },
    calendar,
    learned,
    retention,
    grammar,
    focus: focus.slice(0, 3),
    skills,
    skillNotes,
    checkpoints,
    exams: exam.attempts,
    placement: exam.placement,
  };
};

export { levelName as reportLevelName };
