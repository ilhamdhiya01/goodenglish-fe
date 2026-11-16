"use client";

import React, { useRef } from "react";
import { createPortal } from "react-dom";

import { useDialog } from "../modal/useDialog";

interface SheetProps {
  /** Accessible name; also shown as the sheet's title. */
  label: string;
  /** Shown above the title (the logo in "Lainnya"). */
  header?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

// Bottom sheet (phone menus: "Lainnya", level, week, vocab modes). Same
// behavior as Modal — Escape / tap outside closes, focus stays inside —
// sliding up from the bottom edge, clear of the home bar.
const Sheet = ({ label, header, onClose, children }: SheetProps) => {
  const boxRef = useRef<HTMLDivElement>(null);
  useDialog(boxRef, onClose);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-[fade-in_200ms_var(--ease-lompat)] items-end justify-center bg-ink/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="flex max-h-[85vh] w-full max-w-[520px] animate-[sheet-up_200ms_var(--ease-lompat)] flex-col rounded-t-xl border-2 border-b-0 border-line bg-surface pb-[max(16px,env(safe-area-inset-bottom))] shadow-overlay outline-none"
      >
        <div className="flex flex-col items-center gap-3 px-4 pt-2.5 pb-2">
          <span aria-hidden className="h-1.5 w-10 rounded-full bg-line" />
          {header && <div className="self-start pt-1.5 pb-1">{header}</div>}
          <span className="self-start text-base leading-[22px] font-extrabold text-ink">
            {label}
          </span>
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto px-4">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default Sheet;
