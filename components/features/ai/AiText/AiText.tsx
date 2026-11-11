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

const AiText = React.memo(({ text }: { text: string }) => {
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
      if (SPELLING.test(line))
        blocks.push(
          <p
            key={blocks.length}
            className="m-0 self-start rounded-lg border border-line-2 bg-sand px-2.5 py-1 text-[13px]"
          >
            <span className="mr-1.5 font-mono text-[10.5px] tracking-[0.08em] text-muted">
              SALAH KETIK
            </span>
            {inline(line.replace(SPELLING, ""))}
          </p>,
        );
      else if (line.trim())
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
