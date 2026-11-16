"use client";

import classNames from "classnames";
import React, { useRef } from "react";
import { createPortal } from "react-dom";

import { useDialog } from "./useDialog";

interface ModalProps {
  /** Accessible name of the dialog. */
  label: string;
  onClose: () => void;
  size?: "md" | "lg";
  /** The dialog box itself, usually a <Card>. */
  children: React.ReactNode;
}

// Centered dialog over a dimmed page; full screen below 700px. Escape or a
// click outside the box closes it (forms included, same as the Tanya AI
// panel), focus stays inside while it's open, the page behind doesn't
// scroll, and tall content scrolls inside the dialog.
const Modal = ({ label, onClose, size = "md", children }: ModalProps) => {
  const boxRef = useRef<HTMLDivElement>(null);
  useDialog(boxRef, onClose);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-[fade-in_200ms_var(--ease-lompat)] overflow-y-auto bg-ink/40 md:items-start md:justify-center md:px-4 md:py-[max(16px,6vh)]"
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
        className={classNames(
          "w-full outline-none md:rounded-xl md:shadow-overlay",
          // Phone: the box (usually a Card) fills the screen, clear of the notch.
          "max-md:min-h-full max-md:bg-surface max-md:pt-[env(safe-area-inset-top)] max-md:pb-[env(safe-area-inset-bottom)] max-md:[&>*]:min-h-full max-md:[&>*]:rounded-none max-md:[&>*]:border-0 max-md:[&>*]:shadow-none",
          size === "lg" ? "md:max-w-[920px]" : "md:max-w-[640px]",
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
