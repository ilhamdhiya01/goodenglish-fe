import React from "react";

import TargetMark from "@/components/shared/patterns/target-mark";

// A sentence whose <b>…</b> part (the bit that changes between forms) gets
// the target-word band, e.g. "She <b>has been</b> sick since Monday."
const Marked = ({ s }: { s: string }) => (
  <>
    {s
      .split(/(<b>.*?<\/b>)/g)
      .map((p, k) =>
        p.startsWith("<b>") ? (
          <TargetMark key={k}>{p.slice(3, -4)}</TargetMark>
        ) : (
          <span key={k}>{p}</span>
        ),
      )}
  </>
);

export default Marked;
