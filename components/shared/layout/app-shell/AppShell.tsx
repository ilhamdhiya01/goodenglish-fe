"use client";

import classNames from "classnames";
import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import AiChat from "@/components/features/ai/AiChat";
import { Tests } from "@/components/features/tests";
import ActivityTracker from "@/components/providers/ActivityTracker";
import PlanAutoCheck from "@/components/providers/PlanAutoCheck";
import TtsBootstrap from "@/components/providers/TtsBootstrap";
import ConnectionError from "@/components/shared/connection-error";
import { NON_TAB_MENUS } from "@/const/access.constant";
import { isActivePath, NAV } from "@/const/nav.constant";
import { loadNotes } from "@/lib/content";
import { unlockedLevels } from "@/lib/helpers/exam.helper";
import { startProgress } from "@/lib/helpers/progress-hydrate.helper";
import {
  flushProgress,
  flushProgressOnExit,
  flushProgressOnHide,
  hasPendingProgress,
  queueProgress,
  refreshProgress,
} from "@/lib/helpers/progress-sync.helper";
import {
  hasLegacyProgress,
  readLegacyProgress,
  setTimeZone,
} from "@/lib/helpers/storage.helper";
import { useSession } from "@/lib/hooks/auth/useSession";
import { useProgress } from "@/lib/hooks/progress/useProgress";
import { useWords } from "@/lib/hooks/words/useWords";
import type { ProgressKey, ProgressMap } from "@/lib/types/progress-sync.types";
import type { LevelId, MenuId } from "@/lib/types/session.types";
import { ROUTES } from "@/routes";
import { useAccessStore } from "@/stores/useAccessStore";
import { useAiChatStore } from "@/stores/useAiChatStore";
import { useExamStore } from "@/stores/useExamStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { useSharedWordsStore } from "@/stores/useSharedWordsStore";
import { useTestRunStore } from "@/stores/useTestRunStore";

import { useAccountActions } from "../account/useAccountActions";
import ImportPrompt from "../import-prompt";
import BottomNav from "../nav/BottomNav";
import IconRail from "../nav/IconRail";
import Sidebar from "../nav/Sidebar";
import ScrollTopButton from "../scroll-top-button";
import TodayBar from "../today-bar";
import TopBar from "../top-bar";

// This browser already answered the "import old progress?" question.
const IMPORT_DECIDED_KEY = "vocab-import-decided-v1";

export const menuOfPath = (pathname: string) =>
  pathname.split("/")[1] as MenuId;

interface AppShellProps {
  children: React.ReactNode;
}

// Page frame. ≥1100px: sidebar + top row (search, ⋯, Tanya AI); 700–1099px:
// icon rail + the same top row; <700px: a sticky top bar and a bottom nav.
// Then the "Hari ini" line and the route content. It renders nothing until
// the device session and the token's progress are loaded, so every store
// starts from server data and the server render never disagrees with the
// client.
const AppShell = React.memo(({ children }: AppShellProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    session,
    isError: sessionError,
    isUnauthorized,
    refetch: refetchSession,
    isFetching: sessionFetching,
  } = useSession();
  const {
    progress,
    versions,
    isError: progressError,
    refetch: refetchProgress,
  } = useProgress(!!session);
  const [retryingProgress, setRetryingProgress] = useState(false);
  const { words, isError: wordsError } = useWords(!!session);
  const setSession = useAccessStore((s) => s.setSession);
  const setWords = useSharedWordsStore((s) => s.setWords);
  const { actions, extras } = useAccountActions();
  const aiOpen = useAiChatStore((s) => s.open);

  // Also re-runs after an admin edit refetches the list.
  useEffect(() => {
    if (words) setWords(words);
  }, [words, setWords]);
  // A failed word list must not lock the learner out: the app still works
  // with just the bundled vocabulary.
  const wordsSettled = !!words || wordsError;

  const [ready, setReady] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const legacy = useMemo<ProgressMap | null>(() => {
    if (!progress || Object.keys(progress).length > 0) return null;
    try {
      if (localStorage.getItem(IMPORT_DECIDED_KEY)) return null;
    } catch {
      return null;
    }
    const old = readLegacyProgress();
    return hasLegacyProgress(old) ? old : null;
  }, [progress]);

  const start = useCallback(
    (docs: ProgressMap) => {
      if (!session) return;
      setSession(session);
      // Before any store reads "today" from the progress just loaded.
      setTimeZone(session.timeZone);
      // Server documents plus this token's saves a closed tab left behind.
      const map = startProgress(
        docs,
        versions,
        session.tokenId ?? `label:${session.label}`,
      );
      // Land on a level this token may open.
      const lvl = useLevelStore.getState();
      if (!session.levels.includes(lvl.level as never)) {
        lvl.setLevel(session.levels[0]);
      }
      const exam = useExamStore.getState();
      if (session.requireExam) {
        // "Wajib lulus ujian": remember where this learner started, and
        // never sit on a level the exams haven't opened yet.
        if (!exam.base && Object.keys(map).length > 0)
          exam.setBase(useLevelStore.getState().level as LevelId);
        const open = unlockedLevels({
          allowed: session.levels,
          requireExam: true,
          exam: useExamStore.getState(),
          current: useLevelStore.getState().level as LevelId,
        });
        if (
          open.length &&
          !open.includes(useLevelStore.getState().level as LevelId)
        )
          useLevelStore.getState().setLevel(open[open.length - 1]);
      }
      // A brand-new learner (no progress at all): offer the placement test.
      if (Object.keys(map).length === 0 && !exam.placement) {
        useTestRunStore.getState().open({ kind: "welcome" });
      }
      setReady(true);
    },
    [session, setSession, versions],
  );

  // No (valid) session → token screen. Other errors (offline, server down)
  // show "Tidak bisa terhubung" below instead of signing the learner out.
  useEffect(() => {
    if (isUnauthorized) router.replace(ROUTES.ACCESS);
  }, [isUnauthorized, router]);

  useEffect(() => {
    if (!session || !progress || !wordsSettled || ready || legacy) return;
    start(progress);
  }, [session, progress, wordsSettled, ready, legacy, start]);

  // Routes this token may not open bounce to its first allowed menu; the
  // admin dashboard lives outside this shell.
  useEffect(() => {
    if (!ready || !session) return;
    const menu = menuOfPath(pathname);
    // "ai" (the floating chat) and "roleplay" (inside Skenario) are never a
    // page to land on.
    const home = session.menus.find((m) => !NON_TAB_MENUS.includes(m));
    if (!session.menus.includes(menu) && home) router.replace("/" + home);
  }, [ready, session, pathname, router]);

  // Old hash links (goodenglish.my.id/#/vocab) from the SPA keep working.
  useEffect(() => {
    if (!ready) return;
    const hash = window.location.hash;
    if (hash.startsWith("#/")) router.replace(hash.slice(1));
  }, [ready, router]);

  // Word explanations (separate ±2.6 MB chunk) load in the background after
  // the page is up, so the first bundle stays light.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => loadNotes().catch(() => {}), 2000);
    return () => clearTimeout(t);
  }, [ready]);

  // Don't lose the last few taps when the tab is hidden or closed; when it
  // comes back, pick up what another device saved meanwhile.
  useEffect(() => {
    if (!ready) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushProgressOnHide();
      else if (!hasPendingProgress()) void refreshProgress();
    };
    window.addEventListener("pagehide", flushProgressOnExit);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flushProgressOnExit);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ready]);

  const decideImport = useCallback(
    async (doImport: boolean) => {
      try {
        localStorage.setItem(IMPORT_DECIDED_KEY, "1");
      } catch {
        /* ignore */
      }
      if (!doImport || !legacy) {
        start({});
        return;
      }
      setIsImporting(true);
      // Start first, so these first saves already carry "no document yet"
      // as their base.
      start(legacy);
      for (const [key, value] of Object.entries(legacy)) {
        queueProgress(key as ProgressKey, value);
      }
      await flushProgress();
      setIsImporting(false);
    },
    [legacy, start],
  );

  if (sessionError && !isUnauthorized) {
    return (
      <ConnectionError
        onRetry={() => void refetchSession()}
        isRetrying={sessionFetching}
      />
    );
  }

  if (progressError) {
    return (
      <ConnectionError
        isRetrying={retryingProgress}
        onRetry={() => {
          setRetryingProgress(true);
          void refetchProgress().finally(() => setRetryingProgress(false));
        }}
      />
    );
  }

  if (!ready && legacy) {
    return (
      <ImportPrompt
        knownCount={Object.keys((legacy.known as object) || {}).length}
        customCount={Array.isArray(legacy.custom) ? legacy.custom.length : 0}
        isImporting={isImporting}
        onImport={() => void decideImport(true)}
        onSkip={() => void decideImport(false)}
      />
    );
  }

  // Never render a menu this token may not open, not even for the one frame
  // before the redirect effect above runs.
  const menuAllowed = !!session?.menus.includes(menuOfPath(pathname));
  const hasAi = !!session?.menus.includes("ai");

  if (!ready || !menuAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[12.5px] font-extrabold tracking-[0.07em] text-ink-2">
        MEMUAT…
      </div>
    );
  }

  return (
    // --shell-top (height of the sticky top bar) lives in globals.css.
    <div
      className={classNames(
        "min-h-dvh md:grid md:grid-cols-[88px_minmax(0,1fr)] lg:grid-cols-[250px_minmax(0,1fr)]",
        // ≥1100px the open Tanya AI panel sits beside the page: make room.
        aiOpen && hasAi && "lg:pr-[400px]",
      )}
    >
      <TtsBootstrap />
      <PlanAutoCheck />
      <ActivityTracker />
      <Sidebar className="hidden lg:flex" />
      <IconRail className="hidden md:flex lg:hidden" />
      <div className="flex min-w-0 flex-col">
        <TopBar actions={actions} hasAi={hasAi} />
        <main className="@container mx-auto flex w-full max-w-[1160px] flex-col gap-6 px-4 pt-4 pb-[calc(96px+env(safe-area-inset-bottom))] md:px-8 md:pt-6 md:pb-20">
          {/* One h1 per page for screen readers; the visible titles are h2.
              main is a size container: pages pick one or two columns from
              the room they get (less while Tanya AI sits beside them). */}
          <h1 className="sr-only">
            {NAV.find((n) => isActivePath(pathname, n.path))?.label ??
              "GoodEnglish"}
          </h1>
          <TodayBar />
          {children}
        </main>
      </div>
      <BottomNav actions={actions} className="md:hidden" />
      <ScrollTopButton />
      {extras}
      <Tests.TestHost />
      {hasAi && <AiChat />}
    </div>
  );
});

AppShell.displayName = "AppShell";

export default AppShell;
