"use client";

import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import { LuCircleCheck, LuRotateCcw, LuX } from "react-icons/lu";

import Button from "@/components/ui/button";
import IconButton from "@/components/ui/icon-button";
import ProgressBar from "@/components/ui/progress-bar";
import { loadingDevice, loadKokoro, modelCached } from "@/lib/tts/kokoro";
import { useTtsStore } from "@/stores/useTtsStore";

const DONE_FOR_MS = 3000;

// Test browsers (Playwright sets navigator.webdriver) don't download the
// ±90 MB model unasked.
const automated = () =>
  typeof navigator !== "undefined" && navigator.webdriver === true;

// The AI voice model downloads by itself right after login (once; later
// visits load it from the browser's cache), so the first "Putar" or speaker
// tap doesn't wait for it. While it really downloads (its file isn't in the
// browser's cache: first time, or the cache was cleared) a small card shows
// how far it is, then "Suara AI siap" for a moment. A failure can be retried.
const TtsBootstrap = () => {
  const status = useTtsStore((s) => s.status);
  const progress = useTtsStore((s) => s.progress);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(false);
  // This card starts the download (and so reports its failure) except in
  // automated test browsers.
  const autoLoad = !automated();
  const shownRef = useRef(false);

  // "Siap" for a moment after a download that was shown; reset on change.
  useEffect(
    () =>
      useTtsStore.subscribe((s, prev) => {
        if (s.status === prev.status) return;
        if (s.status === "loading") setHidden(false);
        if (s.status === "ready" && shownRef.current) {
          setDone(true);
          setTimeout(() => setDone(false), DONE_FOR_MS);
        }
        if (s.status !== "loading") {
          shownRef.current = false;
          setShown(false);
        }
      }),
    [],
  );

  useEffect(() => {
    if (autoLoad) void loadKokoro().catch(() => {});
  }, [autoLoad]);

  // Loading from the browser's cache is no download: show the card only
  // when the model file isn't there.
  useEffect(() => {
    if (status !== "loading") return;
    let alive = true;
    void modelCached(loadingDevice()).then((cached) => {
      if (!alive || cached) return;
      shownRef.current = true;
      setShown(true);
    });
    return () => {
      alive = false;
    };
  }, [status]);

  const card =
    "fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[min(380px,calc(100%-32px))] -translate-x-1/2 animate-[fade-in_150ms_var(--ease-lompat)] items-center gap-3 rounded-xl border-2 border-line bg-surface px-4 py-3 shadow-overlay md:bottom-6";

  if (status === "loading" && shown && !hidden) {
    return (
      <div
        role="status"
        className={classNames(card, "flex-col items-stretch gap-2")}
      >
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-extrabold text-ink">
              Mengunduh suara AI…{" "}
              <span className="tabular-nums">{progress}%</span>
            </span>
            <span className="text-[12.5px] leading-[17px] font-semibold text-ink-2">
              ±90 MB, sekali saja. Aplikasi tetap bisa dipakai.
            </span>
          </div>
          <IconButton
            aria-label="Sembunyikan (unduhan tetap jalan)"
            onClick={() => setHidden(true)}
            className="-mt-1 -mr-1"
          >
            <LuX aria-hidden size={16} />
          </IconButton>
        </div>
        <ProgressBar pct={progress} name="Unduhan suara AI" />
      </div>
    );
  }
  if (done) {
    return (
      <div role="status" className={card}>
        <LuCircleCheck aria-hidden size={18} className="shrink-0 text-ok" />
        <span className="text-sm font-extrabold text-ink">
          Suara AI siap dipakai.
        </span>
      </div>
    );
  }
  if (status === "error" && autoLoad && !hidden) {
    return (
      <div role="alert" className={card}>
        <span className="min-w-0 flex-1 text-sm leading-5 font-bold text-ink">
          Suara AI gagal diunduh. Periksa koneksi internetmu.
        </span>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => void loadKokoro().catch(() => {})}
        >
          <LuRotateCcw aria-hidden size={14} />
          Coba lagi
        </Button>
        <IconButton aria-label="Tutup" onClick={() => setHidden(true)}>
          <LuX aria-hidden size={16} />
        </IconButton>
      </div>
    );
  }
  return null;
};

export default TtsBootstrap;
