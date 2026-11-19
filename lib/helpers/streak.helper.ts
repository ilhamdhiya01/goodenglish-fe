// Rencana's daily streak, shared by Rencana, Progres and the admin overview
// (goodenglish-be learner-overview.ts uses the same rule). Days are day
// numbers (today()).
//
// Two kinds of day records live in plan.days:
// - old Rencana: { b1, b2, b3 } — counts with ≥ 3 blocks on weekdays, ≥ 1 on
//   weekends;
// - new Rencana: { v2: true, s, ulang, kata, … } — `s` is the day's own
//   verdict, computed from the activity log when it was written.
// Old days keep the old rule, so history never changes meaning.

const DAY_MS = 86_400_000;

export type PlanDays = Record<string, Record<string, boolean> | undefined>;

const isV2 = (rec: Record<string, boolean> | undefined) => rec?.v2 === true;

/** Blocks / steps done that day (the version marker and verdict excluded). */
export const blocksOn = (days: PlanDays | undefined, d: number) => {
  const rec = days?.[String(d)] ?? {};
  return Object.entries(rec).filter(
    ([k, v]) => v && !(isV2(rec) && (k === "v2" || k === "s")),
  ).length;
};

export const isWeekend = (d: number) => {
  const wd = new Date(d * DAY_MS).getUTCDay();
  return wd === 0 || wd === 6;
};

/** A day counts: new days by their verdict; old ones weekdays 3 blocks,
 * weekends 1. */
export const dayDone = (days: PlanDays | undefined, d: number) => {
  const rec = days?.[String(d)];
  if (isV2(rec)) return rec!.s === true;
  return blocksOn(days, d) >= (isWeekend(d) ? 1 : 3);
};

/** Strength of a day for the Progres calendar (0–3). */
export const dayStrength = (days: PlanDays | undefined, d: number) => {
  const rec = days?.[String(d)];
  if (isV2(rec)) return rec!.s === true ? 3 : Math.min(2, blocksOn(days, d));
  return Math.min(3, blocksOn(days, d));
};

/** Days in a row; today counts once it's done, else from yesterday. */
export const streakOf = (days: PlanDays | undefined, today: number) => {
  let streak = 0;
  for (let d = dayDone(days, today) ? today : today - 1; d > today - 400; d--) {
    if (!dayDone(days, d)) break;
    streak++;
  }
  return streak;
};

/** Monday of the week of day d. */
export const mondayOf = (d: number) =>
  d - ((new Date(d * DAY_MS).getUTCDay() + 6) % 7);

export const dayToDate = (d: number) => new Date(d * DAY_MS);
