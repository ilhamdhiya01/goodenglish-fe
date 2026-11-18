"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  activityMenu,
  TICK_MS,
  tickCounts,
  TimeBuffer,
} from "@/lib/helpers/active-time.helper";
import { flushProgressOnExit } from "@/lib/helpers/progress-sync.helper";
import { useActivityStore } from "@/stores/useActivityStore";
import { useTestRunStore } from "@/stores/useTestRunStore";

const SAVE_EVERY_MS = 60_000;

// Counts active learning time per menu for "Progres": every 5 s, only while
// the tab is visible and there was a tap, key, scroll or touch in the last
// minute. Kept in memory and saved once a minute and when the tab is hidden
// (one write, not one per tick). Renders nothing.
const ActivityTracker = () => {
  const pathname = usePathname();
  const path = useRef(pathname);
  useEffect(() => {
    path.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let last = Date.now();
    const buf = new TimeBuffer();
    const touch = () => {
      last = Date.now();
    };
    const save = () => {
      const add = useActivityStore.getState().addTime;
      buf.take().forEach(([menu, sec]) => add(menu, sec));
    };
    const tick = setInterval(() => {
      if (
        tickCounts({
          now: Date.now(),
          lastInteraction: last,
          visible: document.visibilityState === "visible",
        })
      ) {
        const testOpen = useTestRunStore.getState().run?.kind;
        buf.add(
          activityMenu(
            path.current,
            testOpen === "placement" || testOpen === "exam",
          ),
          TICK_MS / 1000,
        );
      }
    }, TICK_MS);
    const flush = setInterval(save, SAVE_EVERY_MS);
    // Hidden or closing: save and send right away (AppShell's own exit
    // flush may already have run).
    const exit = () => {
      save();
      flushProgressOnExit();
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") exit();
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) =>
      window.addEventListener(e, touch, { passive: true, capture: true }),
    );
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", exit);
    return () => {
      clearInterval(tick);
      clearInterval(flush);
      save();
      events.forEach((e) =>
        window.removeEventListener(e, touch, { capture: true }),
      );
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", exit);
    };
  }, []);

  return null;
};

export default ActivityTracker;
