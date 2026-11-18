"use client";

import { type RefObject, useEffect } from "react";

import { lockScroll } from "@/lib/helpers/scroll-lock.helper";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

// Shared by Modal and Sheet: Escape closes, Tab cycles inside the box, the
// page behind doesn't scroll, and focus moves in on open and back on close.
export const useDialog = (
  boxRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !boxRef.current) return;
      const items = [
        ...boxRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ].filter((el) => !el.closest("[hidden], [inert]"));
      if (!items.length) {
        e.preventDefault();
        boxRef.current.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = boxRef.current.contains(active);
      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [boxRef, onClose]);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const unlock = lockScroll();
    boxRef.current?.focus();
    return () => {
      unlock();
      prevFocus?.focus();
    };
  }, [boxRef]);
};
