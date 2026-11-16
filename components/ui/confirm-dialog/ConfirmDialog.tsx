"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import Jalak from "@/components/brand/Jalak";
import Button from "@/components/ui/button";
import { useDialog } from "@/components/ui/modal/useDialog";
import { useConfirmStore } from "@/stores/useConfirmStore";

type Request = NonNullable<
  ReturnType<typeof useConfirmStore.getState>["request"]
>;

const Box = ({ req }: { req: Request }) => {
  const settle = useConfirmStore((s) => s.settle);
  const boxRef = useRef<HTMLDivElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const cancel = useCallback(() => settle(false), [settle]);
  useDialog(boxRef, cancel);
  // useDialog fokus ke kotak; Enter langsung konfirmasi seperti confirm()
  // bawaan, Escape batal.
  useEffect(() => okRef.current?.focus(), []);

  const danger = req.tone === "danger";
  return (
    <div
      className="fixed inset-0 z-[60] flex animate-[fade-in_150ms_var(--ease-lompat)] items-center justify-center bg-ink/40 px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <div
        ref={boxRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={req.message ? "confirm-message" : undefined}
        tabIndex={-1}
        className="flex w-full max-w-[420px] flex-col gap-4 rounded-xl border-2 border-line bg-surface px-6 pt-5 pb-5 shadow-overlay outline-none max-md:px-[18px]"
      >
        <div className="flex items-start gap-3.5">
          <Jalak mood={danger ? "sedih" : "berpikir"} size={48} />
          <div className="flex min-w-0 flex-col gap-1.5 pt-1">
            <h2
              id="confirm-title"
              className="m-0 text-lg leading-6 font-black text-pretty text-ink"
            >
              {req.title}
            </h2>
            {req.message && (
              <p
                id="confirm-message"
                className="m-0 text-[14.5px] leading-[21px] text-pretty text-ink-2"
              >
                {req.message}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2.5 max-sm:flex-col-reverse">
          <Button variant="outline" onClick={cancel}>
            {req.cancelLabel ?? "Batal"}
          </Button>
          <Button
            ref={okRef}
            variant={danger ? "danger" : "accent"}
            onClick={() => settle(true)}
          >
            {req.confirmLabel ?? "Ya"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Dipasang sekali di app/layout.tsx; tampil saat confirmDialog() dipanggil.
const ConfirmDialog = () => {
  const req = useConfirmStore((s) => s.request);
  if (!req) return null;
  return createPortal(<Box key={req.title} req={req} />, document.body);
};

export default ConfirmDialog;
