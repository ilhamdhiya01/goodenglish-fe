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

// Edit distance where swapping two neighbours counts as one edit, so
// "recieve" → "receive" is 1 like a missing letter is.
const distance = (a: string, b: string) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i ? (j ? 0 : i) : j)),
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
};

// A typo is a slip of the fingers: one or two letters off, and never more
// than a third of the word. Bigger changes swap in a different word.
const isSlip = (wrong: string, right: string) => {
  const n = distance(wrong, right);
  return n <= 2 && n * 3 <= Math.max(wrong.length, right.length);
};

// The typo notice keeps only real typos from the question it answers: the
// model also flagged words from earlier messages, "typos" whose fix was the
// same word (flash-lite, Nov 2026) and correct words "fixed" into a synonym
// (someone → somebody). Returns null when nothing is left.
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
      fixes.some((f) => isSlip(w, f)) &&
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
