"use client";

import React, { useEffect } from "react";

import Jalak from "@/components/brand/Jalak";
import Button from "@/components/ui/button";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";

interface ErrorScreenProps {
  error: Error & { digest?: string };
  /** Renders the failed segment again (Next's error boundary reset). */
  reset: () => void;
}

// What a page shows when it throws while rendering, instead of Next's bare
// "Application error" screen. Inside the app it sits in the shell, so the
// menus still work.
const ErrorScreen = ({ error, reset }: ErrorScreenProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-4 px-4 py-12 text-center">
      <Jalak mood="sedih" size={96} />
      <PageHeading>Halaman ini gagal dimuat</PageHeading>
      <Lead>
        Ada yang tidak beres saat menampilkan halaman ini. Coba lagi; kalau
        tetap gagal, muat ulang aplikasi.
      </Lead>
      <Button variant="green" onClick={reset}>
        Coba lagi
      </Button>
    </section>
  );
};

export default ErrorScreen;
