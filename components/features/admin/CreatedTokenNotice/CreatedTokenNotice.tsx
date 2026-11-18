"use client";

import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import SectionLabel from "@/components/ui/section-label";
import TextButton from "@/components/ui/text-button";
import { confirmDialog } from "@/stores/useConfirmStore";

interface CreatedTokenNoticeProps {
  label: string;
  token: string;
  variant?: "created" | "regenerated";
  onClose: () => void;
}

// The plaintext token exists only in this response — it is never stored and
// can't be shown again, so the admin has to copy it now.
const CreatedTokenNotice = React.memo(
  ({ label, token, variant = "created", onClose }: CreatedTokenNoticeProps) => {
    const [copied, setCopied] = useState(false);
    const copy = useCallback(() => {
      void navigator.clipboard.writeText(token).then(() => setCopied(true));
    }, [token]);
    // Closing (Tutup, Escape, a click outside) before copying would lose the
    // token for good: ask first.
    const close = useCallback(async () => {
      if (
        !copied &&
        !(await confirmDialog({
          title: "Tutup tanpa menyalin token?",
          message:
            "Token ini tidak disimpan dan tidak bisa ditampilkan lagi. Kalau hilang, token harus dibuat ulang.",
          confirmLabel: "Tutup",
          tone: "danger",
        }))
      )
        return;
      onClose();
    }, [copied, onClose]);

    return (
      <Modal
        label={`${variant === "regenerated" ? "Token dibuat ulang" : "Token baru"} ${label}`}
        onClose={() => void close()}
      >
        <Card tone="ink" pad="lg">
          <SectionLabel tone="green">
            {variant === "regenerated" ? "TOKEN DIBUAT ULANG" : "TOKEN BARU"} ·{" "}
            {label.toUpperCase()}
          </SectionLabel>
          <code className="rounded-lg border-2 border-accent-line bg-surface px-3 py-2.5 font-mono text-[15px] font-medium break-all text-ink">
            {token}
          </code>
          <span className="text-[14px] leading-[21px] font-semibold text-ink">
            {variant === "regenerated" && "Token lama sudah tidak berlaku. "}
            Salin dan kirim token ini ke pemiliknya sekarang. Token tidak
            disimpan dan{" "}
            <b className="font-extrabold">tidak bisa ditampilkan lagi</b>.
          </span>
          <div className="flex flex-wrap items-center gap-5">
            <Button variant="green" onClick={copy}>
              {copied ? "Tersalin ✓" : "Salin token"}
            </Button>
            <TextButton className="hit-44" onClick={() => void close()}>
              Tutup
            </TextButton>
          </div>
        </Card>
      </Modal>
    );
  },
);

CreatedTokenNotice.displayName = "CreatedTokenNotice";

export default CreatedTokenNotice;
