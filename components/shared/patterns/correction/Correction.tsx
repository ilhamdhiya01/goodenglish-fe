import classNames from "classnames";
import React from "react";

import SpeakButton from "@/components/ui/speak-button";

interface CorrectionProps {
  /** The wrong version, shown struck through. Omit for a ✓-only line. */
  wrong?: React.ReactNode;
  right: React.ReactNode;
  /** Text the speaker reads for the right version (plain string). */
  speak?: string;
  /** Short reason under the pair. */
  why?: React.ReactNode;
  className?: string;
}

// ✕ wrong (struck through) → ✓ right (bold, speakable) → why. The marks are
// visual only; screen readers hear "Salah:" / "Benar:" instead, so the state
// never depends on color or the strike line.
const Correction = ({
  wrong,
  right,
  speak,
  why,
  className,
}: CorrectionProps) => (
  <div className={classNames("flex flex-col gap-1", className)}>
    {wrong != null && (
      <div className="flex items-baseline gap-2 text-[15px] leading-[22px]">
        <span aria-hidden className="w-4 shrink-0 font-black text-bad">
          ✕
        </span>
        <s className="font-semibold text-ink-2 decoration-bad decoration-2">
          <span className="sr-only">Salah: </span>
          {wrong}
        </s>
      </div>
    )}
    <div className="flex items-center gap-2 text-[15px] leading-[22px]">
      <span aria-hidden className="w-4 shrink-0 font-black text-ok">
        ✓
      </span>
      <span className="font-extrabold text-ink">
        <span className="sr-only">Benar: </span>
        {right}
      </span>
      {speak && <SpeakButton text={speak} size={30} icon={14} />}
    </div>
    {why != null && (
      <span className="pl-6 text-[13.5px] leading-[19px] font-semibold text-ink-2">
        {why}
      </span>
    )}
  </div>
);

export default Correction;
