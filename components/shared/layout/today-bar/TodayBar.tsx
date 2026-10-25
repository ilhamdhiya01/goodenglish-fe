"use client";

import classNames from "classnames";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

import { VOCAB_SCEN } from "@/lib/content";
import { itemKey } from "@/lib/helpers/storage.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import { useAccessStore } from "@/stores/useAccessStore";

const NEW_TARGET = 10;

// Satu baris "hari ini mulai dari mana": tiga langkah dengan status & tombol langsung.
const TodayBar = React.memo(() => {
  const { level, week, data, known, dueKeys, doneToday } = useShellData();
  const router = useRouter();
  const pathname = usePathname();
  const menus = useAccessStore((s) => s.session?.menus);

  const weekTitle =
    data.V[String(week)]?.title || data.plan[week - 1]?.[1] || "";
  const newLeft = (data.V[String(week)]?.items || []).filter(
    (it) => !known[itemKey(level, week, it[0], it[1])],
  ).length;
  const scenTitle =
    (
      (VOCAB_SCEN as { level: string; title: string }[]).find(
        (s) => s.level === level,
      ) || (VOCAB_SCEN[0] as { title: string })
    )?.title || "";

  const steps = [
    {
      n: "1",
      path: "/vocab",
      title: newLeft
        ? `Pelajari ${Math.min(NEW_TARGET, newLeft)} kata baru`
        : "Minggu ini sudah hafal semua",
      sub: `Minggu ${String(week).padStart(2, "0")} · ${weekTitle} · sisa ${newLeft}`,
      done: newLeft === 0,
    },
    {
      n: "2",
      path: "/review",
      title: dueKeys.length
        ? `Ulang ${dueKeys.length} kata jatuh tempo`
        : doneToday
          ? `Ulangan selesai (${doneToday} kata)`
          : "Belum ada yang perlu diulang",
      sub: dueKeys.length
        ? "Jawab jujur; yang lupa kembali ke awal"
        : "Kata yang kamu tandai hafal muncul di sini besok",
      done: dueKeys.length === 0,
    },
    {
      n: "3",
      path: "/scenario",
      title: "Latih 1 skenario dengan suara",
      sub: scenTitle,
      done: false,
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[11px] tracking-[0.1em] text-muted">
        HARI INI · 15–20 MENIT
      </span>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-2.5">
        {steps
          .filter((s) => menus?.includes(s.path.slice(1) as never))
          .map((s) => {
            const on = pathname === s.path;
            return (
              <button
                type="button"
                key={s.n}
                onClick={() => router.push(s.path)}
                className={classNames(
                  "flex cursor-pointer items-start gap-3 rounded-[10px] border-[1.5px] px-3.5 py-3 text-left font-sans transition-colors hover:border-ink",
                  on
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-card text-ink",
                  s.done && !on && "opacity-65",
                )}
              >
                <span
                  className={classNames(
                    "inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold",
                    s.done
                      ? "bg-green text-card"
                      : on
                        ? "bg-paper text-ink"
                        : "bg-hairline text-ink",
                  )}
                >
                  {s.done ? "✓" : s.n}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[14.5px] leading-[1.3] font-semibold">
                    {s.title}
                  </span>
                  <span
                    className={classNames(
                      "text-[12.5px] leading-[1.4]",
                      on ? "text-ondark" : "text-muted",
                    )}
                  >
                    {s.sub}
                  </span>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
});

TodayBar.displayName = "TodayBar";

export default TodayBar;
