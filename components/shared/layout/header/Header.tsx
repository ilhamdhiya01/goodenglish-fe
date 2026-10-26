"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

import IconButton from "@/components/ui/icon-button";
import { SelectChevron } from "@/components/ui/select/Select";
import {
  exportProgress,
  importProgressFile,
} from "@/lib/helpers/progress-export.helper";
import { useLogout } from "@/lib/hooks/auth/useLogout";
import { useShellData } from "@/lib/hooks/useShellData";
import { ROUTES } from "@/routes";
import { useAccessStore } from "@/stores/useAccessStore";
import { useVoiceStore } from "@/stores/useVoiceStore";

const ICON = {
  stroke: "currentColor",
  strokeWidth: 1.8,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// Satu kalimat penyemangat per minggu.
const CHEERS = [
  "Salah ucap itu bagian dari belajar. Terus bicara.",
  "Sedikit tiap hari lebih kuat daripada banyak sekali-sekali.",
  "Kamu sudah lebih jago dari minggu lalu.",
  "Tidak perlu sempurna, yang penting dimengerti.",
  "Satu kalimat hari ini, satu percakapan besok.",
  "Berani mencoba sudah setengah jalan.",
];

const Header = React.memo(() => {
  const { week, data, knownCount, all } = useShellData();
  const plan = data.plan.find((p) => p[0] === week);
  const voices = useVoiceStore((s) => s.list);
  const current = useVoiceStore((s) => s.current);
  const selectVoice = useVoiceStore((s) => s.select);
  const isAdmin = useAccessStore((s) => s.session?.role === "admin");
  const { handleLogout, isLoggingOut } = useLogout();

  const [open, setOpen] = useState(false);
  const pop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (pop.current && !pop.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pct = all.length ? (knownCount / all.length) * 100 : 0;
  const label = (v: SpeechSynthesisVoice) =>
    v.name
      .replace(/^Microsoft |^Google /, "")
      .replace(/ Online \(Natural\)/, " (Natural)");

  return (
    <header className="flex flex-col gap-6 border-b-2 border-ink pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="font-mono text-sm font-bold tracking-[0.12em] text-ink">
          GOODENGLISH
        </span>
        <div ref={pop} className="relative flex items-center gap-2">
          <IconButton title="Ekspor progres ke file" onClick={exportProgress}>
            <svg width="16" height="16" viewBox="0 0 24 24" {...ICON}>
              <path d="M12 3v12" />
              <path d="M7 10l5 5 5-5" />
              <path d="M4 19h16" />
            </svg>
          </IconButton>
          <label
            title="Impor progres dari file"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line-2 bg-card text-ink transition-colors hover:border-green"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" {...ICON}>
              <path d="M12 15V3" />
              <path d="M7 8l5-5 5 5" />
              <path d="M4 19h16" />
            </svg>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importProgressFile(f, (msg) => alert(msg));
                e.target.value = "";
              }}
            />
          </label>
          {voices.length > 0 && (
            <IconButton
              title="Pilih suara pengucap"
              active={open}
              onClick={() => setOpen((o) => !o)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" {...ICON}>
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M18.5 5.5a9 9 0 0 1 0 13" />
              </svg>
            </IconButton>
          )}
          {isAdmin && (
            <Link
              href={ROUTES.ADMIN_TOKENS}
              title="Dashboard admin (kelola token)"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line-2 bg-card text-ink transition-colors hover:border-green"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" {...ICON}>
                <circle cx="8" cy="15" r="4" />
                <path d="M10.8 12.2L20 3" />
                <path d="M16 7l3 3" />
              </svg>
            </Link>
          )}
          <IconButton
            title="Keluar dari perangkat ini"
            disabled={isLoggingOut}
            onClick={() => handleLogout()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" {...ICON}>
              <path d="M15 4h4v16h-4" />
              <path d="M10 8l-4 4 4 4" />
              <path d="M6 12h10" />
            </svg>
          </IconButton>
          {open && (
            <div className="absolute top-[calc(100%+8px)] right-0 z-30 flex w-[300px] flex-col gap-2.5 rounded-[10px] border-[1.5px] border-ink bg-card p-3.5 shadow-[0_12px_32px_rgba(29,27,22,.14)]">
              <span className="font-mono text-[11px] tracking-[0.08em] text-muted">
                SUARA PENGUCAP
              </span>
              <div className="relative">
                <select
                  value={current}
                  onChange={(e) => selectVoice(e.target.value)}
                  className="h-9 w-full cursor-pointer appearance-none rounded-md border-[1.5px] border-line-2 bg-sand pr-8 pl-2 font-sans text-[13px] text-ink"
                >
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {label(v) + " · " + v.lang}
                    </option>
                  ))}
                </select>
                <SelectChevron />
              </div>
              <span className="text-xs leading-[1.45] text-muted">
                Memilih suara akan memutar contoh. Suara &quot;Natural&quot;
                terdengar paling alami.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div className="flex min-w-0 flex-1 basis-[320px] flex-col gap-2">
          <span className="font-mono text-xs tracking-[0.08em] text-green">
            MINGGU {week}
            {plan && ` · ${plan[2].toUpperCase()}`}
          </span>
          <h1 className="m-0 text-[clamp(24px,3vw,32px)] leading-tight font-bold tracking-[-0.02em] text-balance">
            {data.V[String(week)]?.title || plan?.[1] || `Minggu ${week}`}
          </h1>
          <span className="text-sm text-ink-3">
            {CHEERS[(week - 1) % CHEERS.length]}
          </span>
        </div>
        <div className="flex min-w-[200px] flex-[0_1_240px] flex-col items-end gap-2 max-sm:flex-[1_1_100%] max-sm:items-start">
          <span className="font-mono text-[11px] tracking-[0.1em] text-muted">
            SUDAH HAFAL
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[44px] leading-none font-bold tracking-[-0.03em] tabular-nums max-sm:text-4xl">
              {knownCount}
            </span>
            <span className="text-base text-muted tabular-nums">
              / {all.length}
            </span>
          </div>
          <div className="h-[3px] w-full overflow-hidden rounded-sm bg-track">
            <div
              className="h-full bg-green transition-[width] duration-300"
              style={{ width: pct + "%" }}
            />
          </div>
          <span className="font-mono text-[11px] text-faint">
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

export default Header;
