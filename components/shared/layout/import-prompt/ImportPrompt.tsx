"use client";

import React from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import SectionLabel from "@/components/ui/section-label";

interface ImportPromptProps {
  knownCount: number;
  customCount: number;
  isImporting: boolean;
  onImport: () => void;
  onSkip: () => void;
}

// Shown once, on the first sign-in from a browser that still holds progress
// from the old localStorage-only app, while this token has none on the server.
const ImportPrompt = React.memo(
  ({
    knownCount,
    customCount,
    isImporting,
    onImport,
    onSkip,
  }: ImportPromptProps) => (
    <div className="mx-auto flex min-h-screen max-w-[640px] flex-col justify-center gap-5 px-[clamp(14px,3vw,28px)] py-12">
      <SectionLabel tone="green">PROGRES DI PERANGKAT INI</SectionLabel>
      <PageHeading>Impor progres lama?</PageHeading>
      <Lead>
        Browser ini masih menyimpan progres dari versi sebelumnya:{" "}
        <b>{knownCount} kata hafal</b>
        {customCount > 0 && <>, {customCount} kata Kataku</>}, beserta rencana
        dan latihanmu. Impor sekarang supaya tersimpan di akunmu dan bisa dibuka
        dari perangkat lain.
      </Lead>
      <Card tone="ink" className="flex-row flex-wrap items-center gap-3">
        <Button variant="green" disabled={isImporting} onClick={onImport}>
          {isImporting ? "Mengimpor…" : "Impor progres"}
        </Button>
        <Button variant="outline" disabled={isImporting} onClick={onSkip}>
          Mulai dari awal
        </Button>
      </Card>
    </div>
  ),
);

ImportPrompt.displayName = "ImportPrompt";

export default ImportPrompt;
