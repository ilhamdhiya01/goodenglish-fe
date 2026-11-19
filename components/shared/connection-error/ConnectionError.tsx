"use client";

import React from "react";

import Jalak from "@/components/brand/Jalak";
import Button from "@/components/ui/button";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import { useOnline } from "@/lib/hooks/useOnline";

interface ConnectionErrorProps {
  /** Try the failed request again. */
  onRetry: () => void;
  isRetrying?: boolean;
}

// The session or progress could not be loaded for a reason other than an
// invalid session (offline, server down). The learner stays signed in: a
// network hiccup must not send them back to the token screen.
const ConnectionError = ({ onRetry, isRetrying }: ConnectionErrorProps) => {
  const online = useOnline();
  return (
    <section
      role="alert"
      className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col items-center justify-center gap-4 px-4 py-12 text-center"
    >
      <Jalak mood="sedih" size={96} />
      <PageHeading>Tidak bisa terhubung</PageHeading>
      <Lead>
        {online
          ? "Server belum bisa dihubungi. Progresmu aman; coba lagi sebentar lagi."
          : "Perangkat sedang offline. Sambungkan internet, lalu coba lagi."}
      </Lead>
      <Button variant="green" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? "Mencoba…" : "Coba lagi"}
      </Button>
    </section>
  );
};

export default ConnectionError;
