import { setProgressSnapshot } from "@/lib/helpers/storage.helper";
import type { ProgressMap } from "@/lib/types/progress-sync.types";
import { useAskPracticeStore } from "@/stores/useAskPracticeStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { usePlanStore } from "@/stores/usePlanStore";
import { usePracticeSessionStore } from "@/stores/usePracticeSessionStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

// Stores are created when their modules load — before the server snapshot
// exists — so each one re-reads its persisted state once it has arrived.
export const applyProgress = (map: ProgressMap) => {
  setProgressSnapshot(map);
  useProgressStore.getState().hydrate();
  useLevelStore.getState().hydrate();
  usePlanStore.getState().hydrate();
  useAskPracticeStore.getState().hydrate();
  usePracticeSessionStore.getState().hydrate();
  useVocabUiStore.getState().hydrate();
};
