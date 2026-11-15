"use client";

import React from "react";
import { LuEllipsis } from "react-icons/lu";

import IconButton from "@/components/ui/icon-button";
import Menu from "@/components/ui/menu";

import type { AccountAction } from "./useAccountActions";

// The ⋯ button in the top bar: install, export, import, voice, admin, sign out.
const AccountMenu = React.memo(
  ({
    actions,
    className,
  }: {
    actions: AccountAction[];
    className?: string;
  }) => (
    <Menu
      label="Menu akun"
      className={className}
      button={(p) => (
        <IconButton aria-label="Menu akun" title="Menu akun" {...p}>
          <LuEllipsis aria-hidden size={18} />
        </IconButton>
      )}
    >
      {actions.map(({ id, label, icon: Icon, onSelect, tone, disabled }) => (
        <React.Fragment key={id}>
          {tone === "bad" && <Menu.Separator />}
          <Menu.Item onSelect={onSelect} tone={tone} disabled={disabled}>
            <span className="flex items-center gap-2.5">
              <Icon aria-hidden size={18} />
              {label}
            </span>
          </Menu.Item>
        </React.Fragment>
      ))}
    </Menu>
  ),
);

AccountMenu.displayName = "AccountMenu";

export default AccountMenu;
