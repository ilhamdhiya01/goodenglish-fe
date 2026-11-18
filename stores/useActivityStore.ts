import { create } from "zustand";

import {
  addEvent,
  addLearned,
  addReview,
  addSeconds,
  backfillActivity,
  normalizeActivity,
  prune,
} from "@/lib/helpers/activity.helper";
import {
  getProgressSnapshot,
  load,
  save,
  STORAGE_KEYS,
  today,
} from "@/lib/helpers/storage.helper";
import type {
  ActivityData,
  ActivityEvent,
  ActivityEventType,
} from "@/lib/types/activity.types";

// "Progres" activity log (progress doc `activity`, in Export/Import). The
// first time, it is filled from the dated data that already exists.

const read = (): { data: ActivityData; fresh: boolean } => {
  const T = today();
  const stored = normalizeActivity(
    load<unknown>(STORAGE_KEYS.activity, null),
    T,
  );
  if (stored) return { data: prune(stored, T), fresh: false };
  return { data: backfillActivity(getProgressSnapshot(), T), fresh: true };
};

const pick = (s: ActivityData): ActivityData => ({
  v: 1,
  since: s.since,
  days: s.days,
  events: s.events,
});

const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

interface ActivityState extends ActivityData {
  addTime: (menu: string, sec: number) => void;
  countReview: (good: boolean) => void;
  countLearned: (by: number) => void;
  log: (
    type: ActivityEventType,
    extra?: Pick<ActivityEvent, "durationSec" | "meta">,
  ) => void;
  setAll: (f: (cur: ActivityData) => ActivityData) => void;
  hydrate: () => void;
}

export const useActivityStore = create<ActivityState>((set, get) => {
  const commit = (next: ActivityData) => {
    save(STORAGE_KEYS.activity, next);
    set(next);
  };
  const init = () => {
    const { data, fresh } = read();
    // The backfill is written once, so it isn't redone on every load.
    if (fresh && (data.events.length || Object.keys(data.days).length))
      save(STORAGE_KEYS.activity, data);
    return data;
  };
  return {
    ...init(),
    hydrate: () => set(init()),
    addTime: (menu, sec) => commit(addSeconds(pick(get()), today(), menu, sec)),
    countReview: (good) => commit(addReview(pick(get()), today(), good)),
    countLearned: (by) => commit(addLearned(pick(get()), today(), by)),
    log: (type, extra) =>
      commit(
        prune(
          addEvent(pick(get()), { id: uid(), type, ts: Date.now(), ...extra }),
          today(),
        ),
      ),
    setAll: (f) => commit(f(pick(get()))),
  };
});
