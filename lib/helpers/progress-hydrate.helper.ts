import { setProgressSnapshot } from "@/lib/helpers/storage.helper";
import type { ProgressMap } from "@/lib/types/progress-sync.types";
import { useAskPracticeStore } from "@/stores/useAskPracticeStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { usePlanStore } from "@/stores/usePlanStore";
import { usePracticeSessionStore } from "@/stores/usePracticeSessionStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

let applied = false;

// Stores are created when their modules load — before the server snapshot
// exists — so each one re-reads its persisted state once it has arrived.
//
// Once per page load only. AppShell remounts when the user comes back from
// /admin (a separate layout) and would otherwise re-apply the snapshot cached
// at page load, rolling the stores back to it; the next save would then
// overwrite everything done since. Login and logout are full page loads, so
// this resets for every session.
export const applyProgress = (map: ProgressMap) => {
  if (applied) return;
  applied = true;
  setProgressSnapshot(map);
  useProgressStore.getState().hydrate();
  useLevelStore.getState().hydrate();
  usePlanStore.getState().hydrate();
  useAskPracticeStore.getState().hydrate();
  usePracticeSessionStore.getState().hydrate();
  useVocabUiStore.getState().hydrate();
};
