import { mergeProgressDoc } from "@/lib/helpers/progress-merge.helper";
import {
  configureProgressSync,
  queueReplay,
  startProgressSync,
} from "@/lib/helpers/progress-sync.helper";
import {
  getProgressSnapshot,
  setProgressSnapshot,
  setSnapshotDoc,
  today,
} from "@/lib/helpers/storage.helper";
import type {
  ProgressKey,
  ProgressMap,
  ProgressVersions,
} from "@/lib/types/progress-sync.types";
import { useActivityStore } from "@/stores/useActivityStore";
import { useAskPracticeStore } from "@/stores/useAskPracticeStore";
import { useExamStore } from "@/stores/useExamStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { useListeningStore } from "@/stores/useListeningStore";
import { useMistakeStore } from "@/stores/useMistakeStore";
import { usePlanStore } from "@/stores/usePlanStore";
import { usePracticeSessionStore } from "@/stores/usePracticeSessionStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { useReadingStore } from "@/stores/useReadingStore";
import { useRoleplayStore } from "@/stores/useRoleplayStore";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

let applied = false;

// The store that reads each document (search_scope is read on demand).
const HYDRATE: Record<ProgressKey, (() => void) | null> = {
  known: () => useProgressStore.getState().hydrate(),
  srs: () => useProgressStore.getState().hydrate(),
  own: () => useProgressStore.getState().hydrate(),
  custom: () => useProgressStore.getState().hydrate(),
  done: () => useProgressStore.getState().hydrate(),
  level: () => useLevelStore.getState().hydrate(),
  weeks: () => useLevelStore.getState().hydrate(),
  askprac: () => useAskPracticeStore.getState().hydrate(),
  plan: () => usePlanStore.getState().hydrate(),
  practice_session: () => usePracticeSessionStore.getState().hydrate(),
  flip: () => useVocabUiStore.getState().hydrate(),
  search_scope: null,
  roleplay: () => useRoleplayStore.getState().hydrate(),
  mistakes: () => useMistakeStore.getState().hydrate(),
  listening: () => useListeningStore.getState().hydrate(),
  reading: () => useReadingStore.getState().hydrate(),
  exam: () => useExamStore.getState().hydrate(),
  activity: () => useActivityStore.getState().hydrate(),
};

configureProgressSync({
  current: (key) => getProgressSnapshot()[key],
  // A merged or refreshed copy: show it in the store that reads it.
  apply: (key, value) => {
    setSnapshotDoc(key, value);
    HYDRATE[key]?.();
  },
  today,
  merge: mergeProgressDoc,
});

// Stores are created when their modules load — before the server snapshot
// exists — so each one re-reads its persisted state once it has arrived.
//
// Once per page load only. AppShell remounts when the user comes back from
// /admin (a separate layout) and would otherwise re-apply the snapshot cached
// at page load, rolling the stores back to it; the next save would then
// overwrite everything done since. Login and logout are full page loads, so
// this resets for every session.
export const applyProgress = (map: ProgressMap) => {
  if (applied) return false;
  applied = true;
  setProgressSnapshot(map);
  useProgressStore.getState().hydrate();
  useLevelStore.getState().hydrate();
  usePlanStore.getState().hydrate();
  useAskPracticeStore.getState().hydrate();
  usePracticeSessionStore.getState().hydrate();
  useVocabUiStore.getState().hydrate();
  useRoleplayStore.getState().hydrate();
  useMistakeStore.getState().hydrate();
  useListeningStore.getState().hydrate();
  useReadingStore.getState().hydrate();
  useExamStore.getState().hydrate();
  // Last: its first fill reads the other docs.
  useActivityStore.getState().hydrate();
  return true;
};

/**
 * First fill of the stores for this page load: the server documents plus
 * this token's saves a closed tab left on the device (sent again right
 * away). Later calls (AppShell remounting) change nothing and return the
 * documents as they are now.
 */
export const startProgress = (
  docs: ProgressMap,
  versions: ProgressVersions | null,
  owner: string,
): ProgressMap => {
  if (applied) return getProgressSnapshot();
  const { map, replay } = startProgressSync(docs, versions, owner);
  applyProgress(map);
  queueReplay(replay);
  return map;
};
