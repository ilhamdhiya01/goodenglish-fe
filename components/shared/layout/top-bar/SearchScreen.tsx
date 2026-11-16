"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LuChevronLeft } from "react-icons/lu";

import IconButton from "@/components/ui/icon-button";
import { useDialog } from "@/components/ui/modal/useDialog";

import GlobalSearch from "../global-search";

// Phone: the magnifier opens global search full screen. Back, Escape or
// picking a result closes it.
const SearchScreen = ({ onClose }: { onClose: () => void }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  useDialog(boxRef, onClose);
  // useDialog focuses the box; the field should have focus instead.
  useEffect(() => {
    boxRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, []);

  return createPortal(
    <div
      ref={boxRef}
      role="dialog"
      aria-modal="true"
      aria-label="Cari kata"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex animate-[fade-in_150ms_var(--ease-lompat)] flex-col gap-3 bg-paper pt-[max(12px,env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)] outline-none"
    >
      <GlobalSearch
        variant="screen"
        onPicked={onClose}
        before={
          <IconButton aria-label="Tutup pencarian" onClick={onClose}>
            <LuChevronLeft aria-hidden size={20} />
          </IconButton>
        }
      />
    </div>,
    document.body,
  );
};

export default SearchScreen;
