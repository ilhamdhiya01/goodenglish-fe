import type { PlanTally } from "@/lib/types/plan.types";

/** Today's activity counters (an older day reads as empty). */
export const tallyOf = (tally: PlanTally | undefined, T: number): PlanTally =>
  tally?.day === T ? tally : { day: T };
