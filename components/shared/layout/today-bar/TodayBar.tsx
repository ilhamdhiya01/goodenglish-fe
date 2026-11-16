"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { LuX } from "react-icons/lu";

import { useTodayPlan } from "@/lib/hooks/useTodayPlan";
import { useAccessStore } from "@/stores/useAccessStore";

// Hidden for the rest of the day (this device only).
const HIDDEN_KEY = "ge-today-line-hidden";

const readHidden = () => {
  try {
    return localStorage.getItem(HIDDEN_KEY);
  } catch {
    return null;
  }
};

// One line on every page except Rencana: today's blocks done and the next
// one, e.g. "Hari ini 1/3 · berikutnya: Masuk →". The full routine is on
// the Rencana page. Can be hidden for the day.
const TodayBar = React.memo(() => {
  const pathname = usePathname();
  const hasPlan = useAccessStore((s) => s.session?.menus.includes("plan"));
  const { T, blocks, day, doneN, allDone } = useTodayPlan();
  const [hiddenDay, setHiddenDay] = useState(readHidden);

  if (!hasPlan || pathname === "/plan" || hiddenDay === String(T)) return null;
  const next = blocks.find((b) => !day[b.id]);

  return (
    <div className="flex min-h-11 items-center gap-3 rounded-lg border-2 border-line bg-sunken py-1 pr-1 pl-3.5 text-sm font-bold text-ink-2">
      <span className="min-w-0 flex-1">
        <span className="font-extrabold text-ink">
          Hari ini {doneN}/{blocks.length}
        </span>
        {" · "}
        {allDone || !next ? (
          <span className="text-ok">✓ semua blok selesai</span>
        ) : (
          <>
            berikutnya:{" "}
            <Link
              href={next.to}
              className="rounded-sm font-extrabold text-accent-edge underline decoration-2 underline-offset-[3px] focus-ring"
            >
              {next.name} →
            </Link>
          </>
        )}
      </span>
      <button
        type="button"
        aria-label="Sembunyikan untuk hari ini"
        title="Sembunyikan untuk hari ini"
        className="hit-44 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-2 focus-ring hover:bg-line"
        onClick={() => {
          try {
            localStorage.setItem(HIDDEN_KEY, String(T));
          } catch {
            /* private mode — hide for this visit only */
          }
          setHiddenDay(String(T));
        }}
      >
        <LuX aria-hidden size={18} />
      </button>
    </div>
  );
});

TodayBar.displayName = "TodayBar";

export default TodayBar;
