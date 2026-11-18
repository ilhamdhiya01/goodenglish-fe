// Rencana's daily streak, shared by Rencana, Progres and the admin overview
// (goodenglish-be learner-overview.ts uses the same rule). Days are UTC
// epoch days (today()); plan.days[day] = { b1, b2, b3 }.

const DAY_MS = 86_400_000;

export type PlanDays = Record<string, Record<string, boolean> | undefined>;

export const blocksOn = (days: PlanDays | undefined, d: number) =>
  Object.values(days?.[String(d)] ?? {}).filter(Boolean).length;

export const isWeekend = (d: number) => {
  const wd = new Date(d * DAY_MS).getUTCDay();
  return wd === 0 || wd === 6;
};

/** A day counts: weekdays 3 blocks, weekends 1. */
export const dayDone = (days: PlanDays | undefined, d: number) =>
  blocksOn(days, d) >= (isWeekend(d) ? 1 : 3);

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
