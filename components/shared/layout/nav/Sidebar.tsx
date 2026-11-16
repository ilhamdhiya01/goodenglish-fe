"use client";

import classNames from "classnames";
import Link from "next/link";
import React from "react";

import Logo from "@/components/brand/Logo";

import LevelPicker from "../level-picker";
import { NavBadge } from "./NavParts";
import { useNavItems } from "./useNavItems";

// ≥1100px: logo, the menus with icon + caps label, the due badge on "Ulang",
// and the level picker at the bottom.
const Sidebar = React.memo(({ className }: { className?: string }) => {
  const { items } = useNavItems();
  return (
    <aside
      aria-label="Navigasi"
      className={classNames(
        "sticky top-0 z-30 h-dvh flex-col gap-6 border-r-2 border-line bg-surface px-3 pt-7 pb-5",
        className,
      )}
    >
      <Link
        href="/plan"
        className="self-start rounded-sm px-2 no-underline focus-ring"
      >
        <Logo size="md" />
      </Link>
      {/* Only the menu list scrolls on short screens, so the level menu
          (which opens above the picker, wider than the sidebar) isn't clipped. */}
      <nav
        aria-label="Menu utama"
        className="-mx-1 flex min-h-0 flex-col gap-1.5 overflow-y-auto px-1 py-0.5"
      >
        {items.map(({ id, path, label, icon: Icon, active, badge }) => (
          <Link
            key={id}
            href={path}
            aria-current={active ? "page" : undefined}
            className={classNames(
              "flex min-h-12 items-center gap-3 rounded-lg border-2 px-3 text-[13.5px] font-extrabold tracking-[0.05em] uppercase no-underline focus-ring transition-colors",
              active
                ? "border-line bg-sunken text-ink"
                : "border-transparent text-ink-2 hover:bg-sunken hover:text-ink",
            )}
          >
            <Icon
              aria-hidden
              size={22}
              className={active ? "text-accent" : "text-ink-2"}
            />
            <span className="min-w-0 flex-1">{label}</span>
            {badge > 0 && <NavBadge n={badge} />}
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        <LevelPicker variant="sidebar" />
      </div>
    </aside>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
