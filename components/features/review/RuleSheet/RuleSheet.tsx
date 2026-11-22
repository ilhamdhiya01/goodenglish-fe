"use client";

import Link from "next/link";
import React from "react";

import { Block } from "@/components/features/cheatsheet/CheatsheetPage/CheatsheetPage";
import Button from "@/components/ui/button";
import Sheet from "@/components/ui/sheet";
import { CHEAT_SECTIONS } from "@/const/cheatsheet.constant";
import { categoryOf, learnHref } from "@/const/mistake-categories.constant";
import { ruleOf } from "@/lib/helpers/cheat-rules.helper";
import type { MistakeRecord } from "@/lib/types/mistake.types";

/** The Cheat sheet section a mistake's rule (or category) belongs to. */
export const sectionOfMistake = (m: MistakeRecord) =>
  ruleOf(m.rule)?.section ??
  CHEAT_SECTIONS.find((s) => s.id === categoryOf(m.category).cheat) ??
  null;

interface Props {
  m: MistakeRecord;
  onClose: () => void;
}

// "Lihat aturannya" in Ulang: the rule the mistake breaks, over the card
// (so the card and what was typed stay). Mistakes recorded before rules had
// ids, or with no single rule, show their category's Cheat sheet section.
const RuleSheet = ({ m, onClose }: Props) => {
  const ref = ruleOf(m.rule);
  const section = sectionOfMistake(m);
  const rules = section?.blocks.filter((b) => b.kind === "rule") ?? [];
  const href = section ? `/cheatsheet#${section.id}` : learnHref(m.category);

  return (
    <Sheet
      label={section?.title ?? categoryOf(m.category).label}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 pb-1">
        {ref ? (
          <Block b={ref.rule} ruleNo={rules.indexOf(ref.rule) + 1} />
        ) : (
          section?.blocks.map((b, i) => (
            <Block
              key={i}
              b={b}
              ruleNo={b.kind === "rule" ? rules.indexOf(b) + 1 : 0}
            />
          ))
        )}
        <Link
          href={href}
          className="self-start text-sm font-bold text-accent-edge underline decoration-dotted underline-offset-[3px] focus-ring"
        >
          Buka Cheat sheet lengkap
        </Link>
        <Button variant="green" size="lg" className="w-full" onClick={onClose}>
          Kembali ke kartu
        </Button>
      </div>
    </Sheet>
  );
};

export default RuleSheet;
