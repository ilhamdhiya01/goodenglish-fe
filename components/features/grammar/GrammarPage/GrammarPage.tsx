"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { Ask } from "@/components/features/ask";
import AuxGuide from "@/components/features/grammar/AuxGuide/AuxGuide";
import BeenGuide from "@/components/features/grammar/BeenGuide/BeenGuide";
import ConjGuide from "@/components/features/grammar/ConjGuide/ConjGuide";
import Glossary from "@/components/features/grammar/Glossary/Glossary";
import IrrGuide from "@/components/features/grammar/IrrGuide/IrrGuide";
import NumGuide from "@/components/features/grammar/NumGuide/NumGuide";
import PrepGuide from "@/components/features/grammar/PrepGuide/PrepGuide";
import TenseGuide from "@/components/features/grammar/TenseGuide/TenseGuide";
import ThisItGuide from "@/components/features/grammar/ThisItGuide/ThisItGuide";
import ListItem from "@/components/shared/patterns/list-item";
import FieldLabel from "@/components/ui/field-label";
import Select from "@/components/ui/select";
import { GRAMMAR_SUBS, type GrammarSub } from "@/lib/types/grammar.types";

const SUB: Record<GrammarSub, React.ComponentType> = {
  istilah: Glossary,
  tense: TenseGuide,
  bedo: AuxGuide,
  thit: ThisItGuide,
  been: BeenGuide,
  ask: Ask.AskGuide,
  prep: PrepGuide,
  conj: ConjGuide,
  irr: IrrGuide,
  num: NumGuide,
};

// Halaman Panduan grammar — sub-tab di-URL-kan (/grammar/tense dsb), menggantikan
// localStorage 'grammarSub' versi lama.
// `sub` is validated by app/(main)/grammar/[sub]/page.tsx before it gets here.
const GrammarPage = React.memo(({ sub }: { sub: GrammarSub }) => {
  const router = useRouter();
  const Body = SUB[sub];
  const current = GRAMMAR_SUBS.find((g) => g.id === sub);

  return (
    <section className="flex flex-col gap-5">
      <div className="grid items-start gap-5 md:grid-cols-[230px_minmax(0,1fr)]">
        {/* Phone: one select; wider screens: the list of sections. */}
        <FieldLabel label="Bagian" className="md:hidden">
          <Select
            value={sub}
            aria-label={`Bagian: ${current?.label ?? ""}`}
            onChange={(e) => router.push("/grammar/" + e.target.value)}
          >
            {GRAMMAR_SUBS.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <nav
          aria-label="Bagian panduan grammar"
          className="hidden flex-col gap-1 rounded-xl border-2 border-line bg-surface p-2 md:sticky md:top-[calc(var(--shell-top)+24px)] md:flex"
        >
          {GRAMMAR_SUBS.map(({ id, label }) => (
            <ListItem key={id} href={"/grammar/" + id} active={id === sub}>
              {label}
            </ListItem>
          ))}
        </nav>
        <div className="flex min-w-0 flex-col gap-5">
          <Body />
        </div>
      </div>
    </section>
  );
});

GrammarPage.displayName = "GrammarPage";

export default GrammarPage;
