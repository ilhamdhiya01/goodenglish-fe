import { useSyncExternalStore } from "react";

import { today } from "@/lib/helpers/storage.helper";

// The learning day as React state: it changes when the day turns over while
// the app stays open, and is re-read when the tab comes back, so memos and
// effects keyed on it (due cards, Rencana ticks) don't go stale.
const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, 30_000);
  const onVisible = () => {
    if (document.visibilityState === "visible") onChange();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", onVisible);
  };
};

export const useToday = () => useSyncExternalStore(subscribe, today, today);
