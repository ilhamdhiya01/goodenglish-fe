"use client";

import classNames from "classnames";
import Link from "next/link";
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
  const Body = SUB[sub];

  return (
    <section className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap gap-2">
        {GRAMMAR_SUBS.map(({ id, label }) => (
          <Link
            key={id}
            href={"/grammar/" + id}
            className={classNames(
              "inline-flex h-9 items-center rounded-full border-[1.5px] px-3.5 text-[13.5px] font-semibold no-underline transition-colors",
              id === sub
                ? "border-ink bg-ink text-paper"
                : "border-line-2 bg-card text-ink hover:border-ink",
            )}
          >
            {label}
          </Link>
        ))}
      </div>
      <Body />
    </section>
  );
});

GrammarPage.displayName = "GrammarPage";

export default GrammarPage;
