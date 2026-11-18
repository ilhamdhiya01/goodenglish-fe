import { create } from "zustand";

import type { LevelId } from "@/lib/types/session.types";

// Which test is open over the app (TestRunner): the placement welcome, the
// placement test itself, or one level's exam.
export type TestRun =
  | { kind: "welcome" }
  | { kind: "placement" }
  | { kind: "exam"; level: LevelId };

interface TestRunState {
  run: TestRun | null;
  open: (run: TestRun) => void;
  close: () => void;
}

export const useTestRunStore = create<TestRunState>((set) => ({
  run: null,
  open: (run) => set({ run }),
  close: () => set({ run: null }),
}));
