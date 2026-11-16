"use client";

import React, { useState } from "react";
import { LuSearch } from "react-icons/lu";

import IconButton from "@/components/ui/icon-button";

import AccountMenu from "../account/AccountMenu";
import type { AccountAction } from "../account/useAccountActions";
import GlobalSearch from "../global-search";
import LevelPicker from "../level-picker";
import { useNavItems } from "../nav/useNavItems";
import AskAiButton from "./AskAiButton";
import SearchScreen from "./SearchScreen";

interface TopBarProps {
  actions: AccountAction[];
  hasAi: boolean;
}

// The row above the page content.
// ≥700px: global search (max 560px), the level picker on tablets (the
// sidebar holds it on wide screens), the ⋯ account menu and "Tanya AI".
// <700px: a 58px bar that stays on top — level, magnifier, "Tanya AI", and
// the ⋯ menu when every menu already fits in the bottom nav.
const TopBar = React.memo(({ actions, hasAi }: TopBarProps) => {
  const { fitsBottom } = useNavItems();
  const [search, setSearch] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[calc(58px+env(safe-area-inset-top))] items-center gap-2 border-b-2 border-line bg-surface px-4 pt-[env(safe-area-inset-top)] md:hidden">
        <LevelPicker variant="phone" className="min-w-0 shrink" />
        <span className="flex-1" />
        <IconButton aria-label="Cari kata" onClick={() => setSearch(true)}>
          <LuSearch aria-hidden size={18} />
        </IconButton>
        {hasAi && <AskAiButton />}
        {fitsBottom && <AccountMenu actions={actions} />}
      </header>
      {search && <SearchScreen onClose={() => setSearch(false)} />}

      <div className="hidden items-center gap-3 px-8 pt-[26px] md:flex">
        <div className="max-w-[560px] min-w-[200px] flex-1">
          <GlobalSearch />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <LevelPicker variant="bar" className="lg:hidden" />
          <AccountMenu actions={actions} />
          {hasAi && <AskAiButton />}
        </div>
      </div>
    </>
  );
});

TopBar.displayName = "TopBar";

export default TopBar;
