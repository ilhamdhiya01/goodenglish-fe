import classNames from "classnames";
import React from "react";

import type { ScenarioRoleplay } from "@/lib/types/roleplay.types";

interface MissionStepsProps {
  steps: ScenarioRoleplay["steps"];
  done: number[];
  className?: string;
}

// The mission's steps as a checklist. Ticked by the AI as the conversation
// goes; the ✓ / number and the sr-only "selesai" carry the state, not color.
const MissionSteps = ({ steps, done, className }: MissionStepsProps) => (
  <ol
    aria-label="Langkah misi"
    className={classNames("m-0 flex list-none flex-col gap-2 p-0", className)}
  >
    {steps.map((s, i) => {
      const ok = done.includes(i);
      return (
        <li key={i} className="flex items-start gap-2.5">
          <span
            aria-hidden
            className={classNames(
              "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black",
              ok
                ? "border-ok-line bg-ok-bg text-ok"
                : "border-control bg-surface text-ink-3",
            )}
          >
            {ok ? "✓" : i + 1}
          </span>
          <span
            className={classNames(
              "pt-0.5 text-[14px] leading-5",
              ok ? "font-extrabold text-ink" : "font-semibold text-ink-2",
            )}
          >
            {s.id}
            <span className="sr-only">{ok ? " (selesai)" : " (belum)"}</span>
          </span>
        </li>
      );
    })}
  </ol>
);

export default MissionSteps;
