"use client";

import classNames from "classnames";
import React, { useCallback, useEffect, useRef, useState } from "react";

import IconButton from "@/components/ui/icon-button";

export interface TokenMenuItem {
  label: string;
  onSelect: () => void;
  tone?: "default" | "red";
  disabled?: boolean;
}

interface TokenRowMenuProps {
  /** Groups are separated by a divider; destructive actions go last. */
  groups: TokenMenuItem[][];
  disabled?: boolean;
}

const WIDTH = 200;

// "⋯" row menu. Fixed-positioned so it isn't clipped by the table's
// overflow-x-auto wrapper; closes on outside click, Escape, scroll or resize.
const TokenRowMenu = React.memo(({ groups, disabled }: TokenRowMenuProps) => {
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const close = useCallback(() => setPos(null), []);

  const toggle = useCallback(() => {
    if (pos || !btn.current) return setPos(null);
    const r = btn.current.getBoundingClientRect();
    const height = groups.flat().length * 36 + groups.length * 9 + 12;
    const below = r.bottom + 6 + height <= window.innerHeight;
    setPos({
      top: below ? r.bottom + 6 : r.top - 6 - height,
      left: Math.max(8, r.right - WIDTH),
    });
  }, [pos, groups]);

  useEffect(() => {
    if (!pos) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !btn.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pos, close]);

  return (
    <>
      <IconButton
        ref={btn}
        title="Aksi token"
        aria-haspopup="menu"
        aria-expanded={!!pos}
        active={!!pos}
        disabled={disabled}
        onClick={toggle}
        className="h-8 w-8 disabled:cursor-default disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </IconButton>
      {pos && (
        <div
          ref={menu}
          role="menu"
          style={{ top: pos.top, left: pos.left, width: WIDTH }}
          className="fixed z-40 flex flex-col rounded-[10px] border-[1.5px] border-ink bg-card p-1.5 shadow-[0_12px_32px_rgba(29,27,22,.14)]"
        >
          {groups.map((items, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <div className="mx-1 my-1 h-px bg-hairline" />}
              {items.map((it) => (
                <button
                  key={it.label}
                  type="button"
                  role="menuitem"
                  disabled={it.disabled}
                  onClick={() => {
                    close();
                    it.onSelect();
                  }}
                  className={classNames(
                    "flex h-9 cursor-pointer items-center rounded-md px-2.5 text-left text-[13.5px] transition-colors hover:bg-sand disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent",
                    it.tone === "red" ? "text-red" : "text-ink",
                  )}
                >
                  {it.label}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  );
});

TokenRowMenu.displayName = "TokenRowMenu";

export default TokenRowMenu;
