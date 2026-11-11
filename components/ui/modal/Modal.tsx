"use client";

import classNames from "classnames";
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  /** Accessible name of the dialog. */
  label: string;
  onClose: () => void;
  size?: "md" | "lg";
  /** The dialog box itself, usually a <Card>. */
  children: React.ReactNode;
}

// Centered dialog over a dimmed page: Escape or a click outside the box
// closes it (forms included, same as the Tanya AI panel), the page behind
// doesn't scroll, and tall content scrolls inside the dialog.
const Modal = ({ label, onClose, size = "md", children }: ModalProps) => {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock page scroll and move focus into the dialog; give both back on close.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    boxRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/35 px-4 py-[max(16px,6vh)]"
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
          "w-full shadow-[0_24px_64px_rgba(29,27,22,.28)] outline-none",
          size === "lg" ? "max-w-[920px]" : "max-w-[640px]",
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
