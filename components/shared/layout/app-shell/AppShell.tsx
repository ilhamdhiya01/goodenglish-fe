"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import VoiceBootstrap from "@/components/providers/VoiceBootstrap";
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
import type { ProgressKey, ProgressMap } from "@/lib/types/progress-sync.types";
import type { MenuId } from "@/lib/types/session.types";
import { ROUTES } from "@/routes";
import { useAccessStore } from "@/stores/useAccessStore";
import { useLevelStore } from "@/stores/useLevelStore";

import GlobalSearch from "../global-search";
import Header from "../header";
import ImportPrompt from "../import-prompt";
import LevelPicker from "../level-picker";
import ScrollTopButton from "../scroll-top-button";
import TabsNav from "../tabs-nav";
import TodayBar from "../today-bar";

// This browser already answered the "import old progress?" question.
const IMPORT_DECIDED_KEY = "vocab-import-decided-v1";

const menuOfPath = (pathname: string) => pathname.split("/")[1] as MenuId;

interface AppShellProps {
  children: React.ReactNode;
}

// Page frame (header, global search, level picker, today bar, tabs, then the
// route content) — the same layout the SPA had. It renders nothing until the
// device session and the token's progress are loaded, so every store starts
// from server data and the server render never disagrees with the client.
const AppShell = React.memo(({ children }: AppShellProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isError: sessionError } = useSession();
  const { progress, isError: progressError } = useProgress(!!session);
  const setSession = useAccessStore((s) => s.setSession);

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
    if (!session || !progress || ready || legacy) return;
    start(progress);
  }, [session, progress, ready, legacy, start]);

  // Routes this token may not open bounce to its first allowed menu; the
  // admin dashboard lives outside this shell.
  useEffect(() => {
    if (!ready || !session) return;
    const menu = menuOfPath(pathname);
    if (!session.menus.includes(menu)) router.replace("/" + session.menus[0]);
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
      <div className="mx-auto max-w-[640px] px-6 py-24 font-mono text-sm text-red">
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

  if (!ready || !menuAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono text-xs tracking-[0.08em] text-muted">
        MEMUAT…
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-7 px-[clamp(14px,3vw,28px)] pt-[clamp(18px,4vw,36px)] pb-20">
      <VoiceBootstrap />
      <Header />
      <GlobalSearch />
      <LevelPicker />
      <TodayBar />
      <TabsNav />
      {children}
      <ScrollTopButton />
    </div>
  );
});

AppShell.displayName = "AppShell";

export default AppShell;
