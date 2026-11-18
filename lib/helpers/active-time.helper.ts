// Active learning time: a tick counts only while the tab is visible and the
// learner did something in the last minute. Pure, so it can be tested with
// fake clocks; ActivityTracker feeds it.

export const TICK_MS = 5_000;
export const IDLE_MS = 60_000;

export const tickCounts = (o: {
  now: number;
  lastInteraction: number;
  visible: boolean;
}) => o.visible && o.now - o.lastInteraction <= IDLE_MS;

/** The menu a moment of learning belongs to, from the path. */
export const activityMenu = (pathname: string, testOpen: boolean) => {
  if (testOpen) return "exam";
  if (pathname.startsWith("/scenario/roleplay")) return "roleplay";
  return pathname.split("/")[1] || "plan";
};

/** Seconds per menu waiting to be saved. */
export class TimeBuffer {
  private sec = new Map<string, number>();
  add(menu: string, sec: number) {
    this.sec.set(menu, (this.sec.get(menu) ?? 0) + sec);
  }
  take(): [string, number][] {
    const out = [...this.sec.entries()];
    this.sec.clear();
    return out;
  }
}
