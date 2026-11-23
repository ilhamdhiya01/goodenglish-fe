"use client";

import type { AxiosError } from "axios";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useState } from "react";

import Jalak from "@/components/brand/Jalak";
import Logo from "@/components/brand/Logo";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import SectionLabel from "@/components/ui/section-label";
import { accessErrorText } from "@/const/access.constant";
import { useRedeemToken } from "@/lib/hooks/auth/useRedeemToken";
import { useOnline } from "@/lib/hooks/useOnline";
import { ROUTES } from "@/routes";
import { clearAiChat } from "@/stores/useAiChatStore";

// Only pages of this app. Checked by resolving the URL as the browser will,
// not by its prefix: "/\evil.com" starts with one slash yet opens evil.com.
export const safeCallback = (raw: string | null) => {
  if (!raw?.startsWith("/")) return ROUTES.PLAN;
  const u = new URL(raw, window.location.origin);
  return u.origin === window.location.origin
    ? u.pathname + u.search + u.hash
    : ROUTES.PLAN;
};

const OFFLINE =
  "Tidak bisa terhubung ke server. Periksa koneksi, lalu coba lagi.";

// The token screen: one centered column — logo, title, the ge_… field
// and a full-width "Masuk". Errors sit under the field; an offline device is
// told so before it tries.
const AccessForm = React.memo(() => {
  const searchParams = useSearchParams();
  const { handleRedeem, isRedeeming } = useRedeemToken();
  const online = useOnline();
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
        // A previous token's AI conversation must not carry over.
        clearAiChat();
        // Full load: every store starts fresh for this token's progress.
        window.location.href = safeCallback(searchParams.get("callbackUrl"));
      } catch (err) {
        // No response at all (offline, server down, CORS) — say so instead
        // of the generic "something went wrong".
        setError(
          (err as AxiosError).response
            ? accessErrorText((err as Error).message)
            : OFFLINE,
        );
      }
    },
    [token, handleRedeem, searchParams],
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[392px] flex-col justify-center gap-6 px-4 py-12">
      <Logo variant="stacked" size="lg" className="self-center" />
      <div className="flex flex-col gap-2">
        <SectionLabel tone="green">AKSES</SectionLabel>
        <PageHeading>Masukkan token akses</PageHeading>
        <Lead>
          Token diberikan oleh admin. Progres belajarmu tersimpan di token ini,
          jadi bisa dilanjutkan dari perangkat lain dengan token yang sama.
        </Lead>
      </div>
      {!online && (
        <Card tone="dashed" pad="sm" className="flex-row items-center gap-3">
          <Jalak mood="sedih" />
          <span className="text-[13.5px] leading-[19px] font-bold text-ink-2">
            {OFFLINE}
          </span>
        </Card>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Input
          autoFocus
          value={token}
          onChange={(e) => setToken(e.target.value)}
          readOnly={isRedeeming}
          aria-label="Token akses"
          placeholder="ge_…"
          autoComplete="off"
          spellCheck={false}
          error={error || undefined}
          className="font-mono"
        />
        <Button
          type="submit"
          variant="green"
          size="lg"
          disabled={isRedeeming || !token.trim()}
          className="w-full"
        >
          {isRedeeming ? "Memeriksa…" : "Masuk"}
        </Button>
      </form>
    </main>
  );
});

AccessForm.displayName = "AccessForm";

export default AccessForm;
