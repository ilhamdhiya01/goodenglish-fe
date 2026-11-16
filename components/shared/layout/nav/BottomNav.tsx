"use client";

import classNames from "classnames";
import Link from "next/link";
import React, { useState } from "react";
import { LuMenu } from "react-icons/lu";

import Logo from "@/components/brand/Logo";
import Sheet from "@/components/ui/sheet";

import type { AccountAction } from "../account/useAccountActions";
import { NavBadge } from "./NavParts";
import { useNavItems } from "./useNavItems";

const SLOT =
  "focus-ring relative flex min-h-14 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11.5px] leading-none font-extrabold no-underline transition-colors";

const sheetRow =
  "focus-ring flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-[15px] font-extrabold no-underline hover:bg-sunken";

// Below 700px: up to five slots at the bottom — the first four menus, then
// "Lainnya" with the other menus and the account actions. With four menus
// or fewer they all fit and the account actions live in the top bar's ⋯.
const BottomNav = React.memo(
  ({
    actions,
    className,
  }: {
    actions: AccountAction[];
    className?: string;
  }) => {
    const { bottom, more, fitsBottom } = useNavItems();
    const [open, setOpen] = useState(false);
    const moreActive = more.some((m) => m.active);

    return (
      <>
        <nav
          aria-label="Menu utama"
          className={classNames(
            "fixed inset-x-0 bottom-0 z-30 flex gap-1 border-t-2 border-line bg-surface px-2 pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))]",
            className,
          )}
        >
          {bottom.map(({ id, path, label, icon: Icon, active, badge }) => (
            <Link
              key={id}
              href={path}
              aria-current={active ? "page" : undefined}
              className={classNames(
                SLOT,
                active ? "bg-accent-tint text-accent-edge" : "text-ink-2",
              )}
            >
              <span className="relative">
                <Icon aria-hidden size={24} />
                {badge > 0 && (
                  <NavBadge n={badge} className="absolute -top-2 left-3.5" />
                )}
              </span>
              {label}
            </Link>
          ))}
          {!fitsBottom && (
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setOpen(true)}
              className={classNames(
                SLOT,
                moreActive ? "bg-accent-tint text-accent-edge" : "text-ink-2",
              )}
            >
              <LuMenu aria-hidden size={24} />
              Lainnya
            </button>
          )}
        </nav>

        {open && (
          <Sheet
            label="Lainnya"
            header={<Logo size="sm" />}
            onClose={() => setOpen(false)}
          >
            {more.map(({ id, path, label, icon: Icon, active }) => (
              <Link
                key={id}
                href={path}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={classNames(
                  sheetRow,
                  active ? "bg-accent-tint text-accent-edge" : "text-ink",
                )}
              >
                <Icon aria-hidden size={22} className="text-ink-2" />
                {label}
              </Link>
            ))}
            <div role="separator" className="my-1.5 h-0.5 bg-line" />
            {actions.map(
              ({ id, label, icon: Icon, onSelect, tone, disabled }) => (
                <button
                  type="button"
                  key={id}
                  disabled={disabled}
                  onClick={() => {
                    setOpen(false);
                    onSelect();
                  }}
                  className={classNames(
                    sheetRow,
                    "disabled:cursor-not-allowed disabled:text-ink-3",
                    tone === "bad" ? "text-bad" : "text-ink",
                  )}
                >
                  <Icon aria-hidden size={22} />
                  {label}
                </button>
              ),
            )}
          </Sheet>
        )}
      </>
    );
  },
);

BottomNav.displayName = "BottomNav";

export default BottomNav;
