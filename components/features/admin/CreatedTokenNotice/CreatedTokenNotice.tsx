"use client";

import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import TextButton from "@/components/ui/text-button";

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

    return (
      <Card tone="green" pad="lg">
        <SectionLabel tone="green">
          {variant === "regenerated" ? "TOKEN DIBUAT ULANG" : "TOKEN BARU"} ·{" "}
          {label.toUpperCase()}
        </SectionLabel>
        <code className="rounded-md border-[1.5px] border-green-line bg-card px-3 py-2.5 font-mono text-[15px] break-all text-ink">
          {token}
        </code>
        <span className="text-[13.5px] leading-[1.45] text-green-deep">
          {variant === "regenerated" && "Token lama sudah tidak berlaku. "}
          Salin dan kirim token ini ke pemiliknya sekarang. Token tidak disimpan
          dan <b>tidak bisa ditampilkan lagi</b>.
        </span>
        <div className="flex items-center gap-4">
          <Button variant="green" size="sm" onClick={copy}>
            {copied ? "Tersalin ✓" : "Salin token"}
          </Button>
          <TextButton onClick={onClose}>Tutup</TextButton>
        </div>
      </Card>
    );
  },
);

CreatedTokenNotice.displayName = "CreatedTokenNotice";

export default CreatedTokenNotice;
