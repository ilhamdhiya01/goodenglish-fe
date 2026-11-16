"use client";

import React from "react";
import { LuEllipsis } from "react-icons/lu";

import IconButton from "@/components/ui/icon-button";
import Menu from "@/components/ui/menu";

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

// "⋯" row menu on the shared Menu (arrow keys, Escape, click outside). The
// tables around it don't clip overflow, so the popover can hang below the row.
const TokenRowMenu = React.memo(({ groups, disabled }: TokenRowMenuProps) => (
  <Menu
    label="Aksi token"
    button={(p) => (
      <IconButton
        aria-label="Aksi token"
        title="Aksi token"
        active={p["aria-expanded"]}
        disabled={disabled}
        {...p}
      >
        <LuEllipsis aria-hidden size={18} />
      </IconButton>
    )}
  >
    {groups.map((items, gi) => (
      <React.Fragment key={gi}>
        {gi > 0 && <Menu.Separator />}
        {items.map((it) => (
          <Menu.Item
            key={it.label}
            tone={it.tone === "red" ? "bad" : "default"}
            disabled={it.disabled}
            onSelect={it.onSelect}
          >
            {it.label}
          </Menu.Item>
        ))}
      </React.Fragment>
    ))}
  </Menu>
));

TokenRowMenu.displayName = "TokenRowMenu";

export default TokenRowMenu;
