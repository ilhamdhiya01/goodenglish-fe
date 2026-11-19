import { AUTO_CHECK } from "@/const/plan.constant";
import { isWeekend } from "@/lib/helpers/streak.helper";
import type { PlanTally } from "@/lib/types/plan.types";

// Which Rencana blocks today's activity has completed. Pure, so the rules
// are unit-tested; PlanAutoCheck writes the result to plan.days[today].
//
// - b1 Ulang: cards were actually reviewed until none are due, or the
//   5-question quiz was finished on a day with nothing due. Opening the app
//   ticks nothing.
// - b2 Masuk / b3 Bentuk: unchanged (words marked today; 20 practice answers
//   on odd days, the Pelafalan "sudah" button on even days).
// - The weekend comes from the learning day itself (token time zone), the
//   same day number the streak uses — never from the device clock.

export const tallyOf = (tally: PlanTally | undefined, T: number): PlanTally =>
  tally?.day === T ? tally : { day: T };

export const dayBlocks = (o: {
  T: number;
  /** Word + mistake cards due now. */
  due: number;
  tally: PlanTally | undefined;
}): Record<string, boolean> => {
  const t = tallyOf(o.tally, o.T);
  const b1 = (o.due === 0 && (t.rev || 0) > 0) || !!t.q1;
  if (isWeekend(o.T)) return { b1, b2: false, b3: false };
  const b2 = (t.known || 0) >= AUTO_CHECK.known;
  const b3 =
    o.T % 2 === 1 ? (t.ask || 0) >= AUTO_CHECK.ask : (t.pron || 0) >= 1;
  return { b1, b2, b3 };
};
