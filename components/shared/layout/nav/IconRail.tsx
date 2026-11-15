"use client";

import classNames from "classnames";
import Link from "next/link";
import React from "react";

import Logo from "@/components/brand/Logo";

import { NavBadge } from "./NavParts";
import { useNavItems } from "./useNavItems";

// 700–1099px: the sidebar folded into an 88px rail of icons. Each icon is
// named by aria-label and shows its label as a tooltip on hover / focus.
const IconRail = React.memo(({ className }: { className?: string }) => {
  const { items } = useNavItems();
  return (
    <aside
      aria-label="Navigasi"
      className={classNames(
        "sticky top-0 h-dvh flex-col items-center gap-5 border-r-2 border-line bg-surface pt-6 pb-5",
        className,
      )}
    >
      <Link href="/plan" className="rounded-md focus-ring">
        <Logo variant="mark" size="md" />
      </Link>
      <nav
        aria-label="Menu utama"
        className="flex flex-col items-center gap-1.5"
      >
        {items.map(({ id, path, label, icon: Icon, active, badge }) => (
          <Link
            key={id}
            href={path}
            aria-label={badge ? `${label}, ${badge} kata jatuh tempo` : label}
            aria-current={active ? "page" : undefined}
            className={classNames(
              "group relative flex h-14 w-16 items-center justify-center rounded-lg border-2 focus-ring transition-colors",
              active
                ? "border-line bg-sunken text-accent"
                : "border-transparent text-ink-2 hover:bg-sunken hover:text-ink",
            )}
          >
            <Icon aria-hidden size={26} />
            {badge > 0 && (
              <NavBadge
                n={badge}
                className="absolute -top-1 -right-1 [&>.sr-only]:hidden"
              />
            )}
            <span
              aria-hidden
              className="pointer-events-none absolute left-[calc(100%+10px)] z-40 hidden rounded-md bg-ink px-2.5 py-1.5 text-[13px] font-extrabold whitespace-nowrap text-on-accent group-hover:block group-focus-visible:block"
            >
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
});

IconRail.displayName = "IconRail";

export default IconRail;
