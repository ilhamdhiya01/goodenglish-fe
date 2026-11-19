import React from "react";

import type { WordMark } from "@/lib/helpers/dictation.helper";

/** Typed answer marked word by word. With `hideAnswer` only the positions
 * of the mistakes are marked, not the right words (Dikte before "Coba lagi"). */
const WordMarks = ({
  marks,
  hideAnswer = false,
}: {
  marks: WordMark[];
  hideAnswer?: boolean;
}) => (
  <p className="m-0 flex flex-wrap gap-x-1.5 gap-y-1 text-[17px] leading-7 font-bold">
    {marks.map((m, i) =>
      m.kind === "correct" ? (
        <span key={i} className="text-ink">
          {m.word}
        </span>
      ) : m.kind === "wrong" ? (
        <span key={i} className="text-bad">
          <span className="sr-only">Salah: </span>
          {m.word}
          {!hideAnswer && (
            <span className="text-[13px] font-extrabold text-ok">
              {" "}
              (<span className="sr-only">yang benar </span>
              {m.expected})
            </span>
          )}
        </span>
      ) : m.kind === "missing" ? (
        <span key={i} className="rounded bg-sunken px-1 text-ink-3">
          <span className="sr-only">Terlewat: </span>
          {hideAnswer ? "___" : m.expected}
        </span>
      ) : (
        <s key={i} className="text-ink-3 decoration-2">
          <span className="sr-only">Berlebih: </span>
          {m.word}
        </s>
      ),
    )}
  </p>
);

export default WordMarks;
