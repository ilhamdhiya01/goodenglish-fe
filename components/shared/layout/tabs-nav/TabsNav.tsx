"use client";

import classNames from "classnames";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { useShellData } from "@/lib/hooks/useShellData";
import { useAccessStore } from "@/stores/useAccessStore";
import { useQuizStore } from "@/stores/useQuizStore";

const NAV: { path: string; label: string }[] = [
  { path: "/plan", label: "Rencana" },
  { path: "/vocab", label: "Kosakata" },
  { path: "/review", label: "Ulang hari ini" },
  { path: "/scenario", label: "Skenario" },
  { path: "/errors", label: "Kesalahan umum" },
  { path: "/grammar", label: "Panduan grammar" },
  { path: "/pronunciation", label: "Pelafalan" },
];

const TabsNav = React.memo(() => {
  const pathname = usePathname();
  // Only the tabs this access token may open (route path == menu id).
  const menus = useAccessStore((s) => s.session?.menus);
  const { all, week, dueKeys } = useShellData();
  const scope = useQuizStore((s) => s.scope);
  const setScope = useQuizStore((s) => s.setScope);
  const startQuiz = useQuizStore((s) => s.start);

  const start = () => {
    const src = scope === "week" ? all.filter((x) => x.w === week) : all;
    startQuiz(src.length >= 8 ? src : all);
  };

  return (
    <nav className="flex flex-wrap items-center gap-1.5">
      {NAV.filter(({ path }) => menus?.includes(path.slice(1) as never)).map(
        ({ path, label }) => {
          const active =
            path === "/grammar"
              ? pathname.startsWith("/grammar")
              : pathname === path;
          const badge = path === "/review" ? dueKeys.length : 0;
          return (
            <Link
              key={path}
              href={path}
              className={classNames(
                "inline-flex items-center gap-2 rounded-full border-[1.5px] px-4 py-2 text-sm font-semibold no-underline transition-colors",
                active
                  ? "border-ink bg-ink text-paper"
                  : "border-line-2 bg-card text-ink hover:border-ink",
              )}
            >
              {label}
              {badge > 0 && (
                <span
                  className={classNames(
                    "rounded-full px-[7px] py-px font-mono text-[11px]",
                    active ? "bg-paper text-ink" : "bg-green text-card",
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        },
      )}

      {pathname === "/vocab" && (
        <>
          <div className="h-0 basis-full" />
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="mr-0.5 font-mono text-[11px] tracking-[0.08em] text-muted">
              TES CEPAT
            </span>
            <div className="inline-flex h-9 overflow-hidden rounded-full border-[1.5px] border-ink">
              <button
                type="button"
                onClick={() => setScope("week")}
                title="Soal hanya dari minggu yang sedang dibuka"
                className={classNames(
                  "inline-flex cursor-pointer items-center border-none px-3 font-sans text-[12.5px] font-semibold",
                  scope === "week"
                    ? "bg-ink text-paper"
                    : "bg-transparent text-ink",
                )}
              >
                Minggu ini
              </button>
              <button
                type="button"
                onClick={() => setScope("all")}
                title="Soal dari semua minggu di level ini"
                className={classNames(
                  "inline-flex cursor-pointer items-center border-0 border-l-[1.5px] border-ink px-3 font-sans text-[12.5px] font-semibold",
                  scope === "all"
                    ? "bg-ink text-paper"
                    : "bg-transparent text-ink",
                )}
              >
                Semua
              </button>
            </div>
            <button
              type="button"
              onClick={start}
              className="cursor-pointer rounded-full border-[1.5px] border-green bg-green px-4 py-2 font-sans text-sm font-semibold text-card transition-colors hover:bg-green-deep"
            >
              {scope === "week"
                ? `Tes minggu ${week} · 20 soal`
                : "Tes semua minggu · 20 soal"}
            </button>
          </div>
        </>
      )}
    </nav>
  );
});

TabsNav.displayName = "TabsNav";

export default TabsNav;
