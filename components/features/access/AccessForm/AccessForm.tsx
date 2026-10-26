"use client";

import type { AxiosError } from "axios";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import SectionLabel from "@/components/ui/section-label";
import { accessErrorText } from "@/const/access.constant";
import { useRedeemToken } from "@/lib/hooks/auth/useRedeemToken";
import { ROUTES } from "@/routes";

// Only same-site paths, never `//evil.com` or absolute URLs.
const safeCallback = (raw: string | null) =>
  raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : ROUTES.PLAN;

const AccessForm = React.memo(() => {
  const searchParams = useSearchParams();
  const { handleRedeem, isRedeeming } = useRedeemToken();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const value = token.trim();
      if (!value) return;
      setError("");
      try {
        await handleRedeem({ token: value });
        // Full load: every store starts fresh for this token's progress.
        window.location.href = safeCallback(searchParams.get("callbackUrl"));
      } catch (err) {
        // No response at all (offline, server down, CORS) — say so instead
        // of the generic "something went wrong".
        setError(
          (err as AxiosError).response
            ? accessErrorText((err as Error).message)
            : "Tidak bisa terhubung ke server. Periksa koneksi, lalu coba lagi.",
        );
      }
    },
    [token, handleRedeem, searchParams],
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-[560px] flex-col justify-center gap-6 px-[clamp(14px,3vw,28px)] py-12">
      <span className="flex items-center gap-2.5 font-mono text-sm font-bold tracking-[0.12em] text-ink">
        <Image src="/icon.svg" alt="" width={28} height={28} unoptimized />
        GOODENGLISH
      </span>
      <div className="flex flex-col gap-2.5">
        <SectionLabel tone="green">AKSES</SectionLabel>
        <PageHeading>Masukkan token akses</PageHeading>
        <Lead>
          Token diberikan oleh admin. Progres belajarmu tersimpan di token ini,
          jadi bisa dilanjutkan dari perangkat lain dengan token yang sama.
        </Lead>
      </div>
      <Card tone="ink" pad="lg">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input
            autoFocus
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ge_…"
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
          {error && (
            <span className="text-[13.5px] leading-[1.45] text-red">
              {error}
            </span>
          )}
          <Button
            type="submit"
            variant="green"
            disabled={isRedeeming || !token.trim()}
            className="self-start"
          >
            {isRedeeming ? "Memeriksa…" : "Masuk"}
          </Button>
        </form>
      </Card>
    </div>
  );
});

AccessForm.displayName = "AccessForm";

export default AccessForm;
