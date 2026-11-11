import React from "react";

// Renders the small Markdown subset Gemini actually uses: paragraphs,
// "- " / "* " / "1. " lists (nesting flattened), **bold**, *italic* and
// `code`. Built from React nodes, never innerHTML, so model output can't
// inject markup.
const inline = (text: string): React.ReactNode[] =>
  text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <b key={i}>{part.slice(2, -2)}</b>
    ) : part.length > 2 && part.startsWith("*") && part.endsWith("*") ? (
      <i key={i}>{part.slice(1, -1)}</i>
    ) : part.startsWith("`") && part.endsWith("`") ? (
      <code key={i} className="rounded bg-sand px-1 font-mono text-[0.92em]">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );

const BULLET = /^\s*[-*•]\s+/;
const NUMBER = /^\s*\d+[.)]\s+/;
const SPELLING = /^\s*Ejaan:\s*/i;
const TYPO = /\*([^*]+)\*\s*→\s*\*\*([^*]+)\*\*/g;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The typo notice keeps only real typos from the question it answers: the
// model also flagged words from earlier messages and "typos" whose fix was
// the same word (flash-lite, Nov 2026). Returns null when nothing is left.
// Without the question, or in a format we can't read, the line is kept.
export const keepTypos = (line: string, question?: string): string | null => {
  const notice = line.replace(SPELLING, "");
  if (question === undefined) return notice;
  const pairs = [...notice.matchAll(TYPO)];
  if (!pairs.length) return notice;
  const kept = pairs.filter(([, wrong, right]) => {
    const w = wrong.trim().toLowerCase();
    const fixes = right.split(/[/,]/).map((r) => r.trim().toLowerCase());
    return (
      !fixes.includes(w) &&
      new RegExp(`(^|[^\\p{L}])${escape(w)}($|[^\\p{L}])`, "iu").test(question)
    );
  });
  return kept.length
    ? kept.map(([, wrong, right]) => `*${wrong}* → **${right}**`).join(", ")
    : null;
};

interface AiTextProps {
  text: string;
  /** The learner's message this answers; filters the typo notice. */
  question?: string;
}

const AiText = React.memo(({ text, question }: AiTextProps) => {
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={blocks.length}
        className={`m-0 flex flex-col gap-1 pl-5 ${list.ordered ? "list-decimal" : "list-disc"}`}
      >
        {list.items.map((it, i) => (
          <li key={i}>{inline(it)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };

  for (const line of text.split("\n")) {
    const ordered = NUMBER.test(line);
    if (ordered || BULLET.test(line)) {
      if (list && list.ordered !== ordered) flush();
      list ??= { ordered, items: [] };
      list.items.push(line.replace(ordered ? NUMBER : BULLET, ""));
    } else {
      flush();
      // The typo notice the AI puts first ("Ejaan: *somtimes* → **sometimes**").
      if (SPELLING.test(line)) {
        const typos = keepTypos(line, question);
        if (typos)
          blocks.push(
            <p
              key={blocks.length}
              className="m-0 self-start rounded-lg border border-line-2 bg-sand px-2.5 py-1 text-[13px]"
            >
              <span className="mr-1.5 font-mono text-[10.5px] tracking-[0.08em] text-muted">
                SALAH KETIK
              </span>
              {inline(typos)}
            </p>,
          );
      } else if (line.trim())
        blocks.push(
          <p key={blocks.length} className="m-0">
            {inline(line.replace(/^#+\s*/, ""))}
          </p>,
        );
    }
  }
  flush();

  return <div className="flex flex-col gap-2">{blocks}</div>;
});

AiText.displayName = "AiText";

export default AiText;
