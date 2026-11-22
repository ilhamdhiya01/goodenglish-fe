import { PRACTICE, type PracticeTopic } from "@/const/practice-sets.constant";
import { VOCAB_ASK } from "@/lib/content";
import { GRAMMAR_SUBS, type GrammarSub } from "@/lib/types/grammar.types";
import type { MistakeRecord } from "@/lib/types/mistake.types";

// The Panduan grammar practice set a mistake came from. Its practice sets
// mix several rules, so a grammar mistake's "Lihat aturannya" shows the set
// it was answered in (title and what it trains) instead of a Cheat sheet
// rule. AskPractice records these with refId "<set id>:<answer>".

export interface PracticeRef {
  sub: GrammarSub;
  subLabel: string;
  /** Key for usePracticeSessionStore.setTopicSet. */
  topic: PracticeTopic | "ask";
  setId: string;
  no: string;
  title: string;
  detail: string;
}

// Practice topic → its sub-tab (/grammar/:sub).
const TOPIC_SUB: Record<PracticeTopic, GrammarSub> = {
  whb: "been",
  irr: "irr",
  prep: "prep",
  bedo: "bedo",
  tense: "tense",
  conj: "conj",
  thit: "thit",
};

const labelOf = (sub: GrammarSub) =>
  GRAMMAR_SUBS.find((s) => s.id === sub)?.label ?? sub;

export const practiceOf = (
  m: Pick<MistakeRecord, "source" | "refId">,
): PracticeRef | null => {
  if (m.source !== "Grammar" || !m.refId) return null;
  const setId = m.refId.split(":")[0];
  for (const topic of Object.keys(PRACTICE) as PracticeTopic[]) {
    const s = PRACTICE[topic].sets.find((x) => x[0] === setId);
    if (s) {
      const sub = TOPIC_SUB[topic];
      return {
        sub,
        subLabel: labelOf(sub),
        topic,
        setId,
        no: s[1],
        title: s[2],
        detail: s[3],
      };
    }
  }
  const r = (
    (VOCAB_ASK?.rules ?? []) as {
      id: string;
      no: string;
      title: string;
      formula: string;
    }[]
  ).find((x) => x.id === setId);
  return r
    ? {
        sub: "ask",
        subLabel: labelOf("ask"),
        topic: "ask",
        setId,
        no: r.no,
        title: r.title,
        detail: r.formula,
      }
    : null;
};
