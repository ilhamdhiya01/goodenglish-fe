"use client";

import classNames from "classnames";
import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import AiChat from "@/components/features/ai/AiChat";
import PlanAutoCheck from "@/components/providers/PlanAutoCheck";
import VoiceBootstrap from "@/components/providers/VoiceBootstrap";
import { isActivePath, NAV } from "@/const/nav.constant";
import { loadNotes } from "@/lib/content";
import { applyProgress } from "@/lib/helpers/progress-hydrate.helper";
import {
  flushProgress,
  flushProgressOnExit,
  queueProgress,
} from "@/lib/helpers/progress-sync.helper";
import {
  hasLegacyProgress,
  readLegacyProgress,
} from "@/lib/helpers/storage.helper";
import { useSession } from "@/lib/hooks/auth/useSession";
import { useProgress } from "@/lib/hooks/progress/useProgress";
import { useWords } from "@/lib/hooks/words/useWords";
import type { ProgressKey, ProgressMap } from "@/lib/types/progress-sync.types";
import type { MenuId } from "@/lib/types/session.types";
import { ROUTES } from "@/routes";
import { useAccessStore } from "@/stores/useAccessStore";
import { useAiChatStore } from "@/stores/useAiChatStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { useSharedWordsStore } from "@/stores/useSharedWordsStore";

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

const menuOfPath = (pathname: string) => pathname.split("/")[1] as MenuId;

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
  const { session, isError: sessionError } = useSession();
  const { progress, isError: progressError } = useProgress(!!session);
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
    (map: ProgressMap) => {
      if (!session) return;
      setSession(session);
      applyProgress(map);
      // Land on a level this token may open.
      const lvl = useLevelStore.getState();
      if (!session.levels.includes(lvl.level as never)) {
        lvl.setLevel(session.levels[0]);
      }
      setReady(true);
    },
    [session, setSession],
  );

  // No (valid) session → token screen.
  useEffect(() => {
    if (sessionError) router.replace(ROUTES.ACCESS);
  }, [sessionError, router]);

  useEffect(() => {
    if (!session || !progress || !wordsSettled || ready || legacy) return;
    start(progress);
  }, [session, progress, wordsSettled, ready, legacy, start]);

  // Routes this token may not open bounce to its first allowed menu; the
  // admin dashboard lives outside this shell.
  useEffect(() => {
    if (!ready || !session) return;
    const menu = menuOfPath(pathname);
    // "ai" is the floating chat, never a page to land on.
    const home = session.menus.find((m) => m !== "ai");
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

  // Don't lose the last few taps when the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flushProgressOnExit();
    };
    window.addEventListener("pagehide", flushProgressOnExit);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flushProgressOnExit);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

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
      for (const [key, value] of Object.entries(legacy)) {
        queueProgress(key as ProgressKey, value);
      }
      await flushProgress();
      setIsImporting(false);
      start(legacy);
    },
    [legacy, start],
  );

  if (progressError) {
    return (
      <div className="mx-auto max-w-[640px] px-6 py-24 text-sm font-bold text-bad">
        Gagal memuat progres. Muat ulang halaman untuk mencoba lagi.
      </div>
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
    // --shell-top: height of what sticks to the top (the phone's top bar),
    // so sticky page toolbars sit under it.
    <div
      className={classNames(
        "min-h-dvh [--shell-top:calc(58px+env(safe-area-inset-top))] md:grid md:grid-cols-[88px_minmax(0,1fr)] md:[--shell-top:0px] lg:grid-cols-[250px_minmax(0,1fr)]",
        // ≥1100px the open Tanya AI panel sits beside the page: make room.
        aiOpen && hasAi && "lg:pr-[400px]",
      )}
    >
      <VoiceBootstrap />
      <PlanAutoCheck />
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
      {hasAi && <AiChat />}
    </div>
  );
});

AppShell.displayName = "AppShell";

export default AppShell;
