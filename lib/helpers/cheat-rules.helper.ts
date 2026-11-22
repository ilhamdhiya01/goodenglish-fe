import {
  CHEAT_SECTIONS,
  type CheatBlock,
  type CheatSection,
} from "@/const/cheatsheet.constant";

// The Cheat sheet rules by id, so a mistake can point at the exact rule it
// breaks ("Lihat aturannya" in Ulang).

export type CheatRule = Extract<CheatBlock, { kind: "rule" }>;

export interface RuleRef {
  rule: CheatRule;
  section: CheatSection;
}

const BY_ID = new Map<string, RuleRef>();
CHEAT_SECTIONS.forEach((section) =>
  section.blocks.forEach((b) => {
    if (b.kind === "rule") BY_ID.set(b.id, { rule: b, section });
  }),
);

export const CHEAT_RULE_IDS = [...BY_ID.keys()];

/** The rule with this id, or null (unknown or missing id). */
export const ruleOf = (id?: string): RuleRef | null =>
  (id && BY_ID.get(id)) || null;

/** A known rule id, or undefined; for data coming from the AI or storage. */
export const ruleId = (v: unknown): string | undefined =>
  typeof v === "string" && BY_ID.has(v.trim()) ? v.trim() : undefined;
