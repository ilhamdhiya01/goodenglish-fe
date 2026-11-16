"use client";

import React, { useEffect, useSyncExternalStore } from "react";

import ProgressBar from "@/components/ui/progress-bar";
import { preparingText, subscribeSpeaking } from "@/lib/helpers/speech.helper";
import { loadKokoro } from "@/lib/tts/kokoro";
import { useTtsStore } from "@/stores/useTtsStore";

type NetInfo = { saveData?: boolean; type?: string; effectiveType?: string };

// Downloading ±90 MB unasked is fine on Wi-Fi, not on mobile data: there the
// model loads on the first tap of a speaker button instead.
const goodNetwork = () => {
  const c = (navigator as unknown as { connection?: NetInfo }).connection;
  if (!c) return true;
  if (c.saveData || c.type === "cellular") return false;
  return !/^(slow-2g|2g|3g)$/.test(c.effectiveType ?? "");
};

// Loads the voice model in the background once the app is up, and shows the
// download while someone is waiting to hear a word.
const TtsBootstrap = () => {
  const status = useTtsStore((s) => s.status);
  const progress = useTtsStore((s) => s.progress);
  const waiting = useSyncExternalStore(
    subscribeSpeaking,
    () => preparingText() !== null,
    () => false,
  );

  useEffect(() => {
    if (!goodNetwork()) return;
    const t = setTimeout(() => void loadKokoro().catch(() => {}), 3000);
    return () => clearTimeout(t);
  }, []);

  if (status !== "loading" || !waiting) return null;
  return (
    <div
      role="status"
      className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-1/2 z-40 w-[min(320px,calc(100%-32px))] -translate-x-1/2 animate-[fade-in_150ms_var(--ease-lompat)] rounded-xl border-2 border-line bg-surface px-4 py-3 shadow-overlay md:bottom-6"
    >
      <ProgressBar
        pct={progress}
        label={`Menyiapkan suara AI… ${progress}% (sekali saja)`}
      />
    </div>
  );
};

export default TtsBootstrap;
