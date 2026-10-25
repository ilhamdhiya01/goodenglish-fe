import { redirect } from "next/navigation";

import { Grammar } from "@/components/features/grammar";
import { GRAMMAR_SUBS, type GrammarSub } from "@/lib/types/grammar.types";
import { ROUTES } from "@/routes";

// Sub-tabs live in the URL (/grammar/tense, ...); unknown ones go to the
// glossary, as in the SPA.
const GrammarSubPage = async ({
  params,
}: {
  params: Promise<{ sub: string }>;
}) => {
  const { sub } = await params;
  if (!GRAMMAR_SUBS.some((s) => s.id === sub)) {
    redirect(ROUTES.grammarSub("istilah"));
  }
  return <Grammar.GrammarPage sub={sub as GrammarSub} />;
};

export default GrammarSubPage;
