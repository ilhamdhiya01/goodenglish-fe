import React from "react";
import { LuPlay, LuSnail } from "react-icons/lu";

import Button from "@/components/ui/button";

interface PlayButtonsProps {
  onPlay: () => void;
  onSlow: () => void;
  /** Plays so far (0 = not played yet). */
  plays: number;
  disabled?: boolean;
}

// "Putar" (and "Putar lagi" after the first time) plus "Pelan".
const PlayButtons = ({ onPlay, onSlow, plays, disabled }: PlayButtonsProps) => (
  <div className="flex flex-wrap items-center gap-2">
    <Button variant="green" disabled={disabled} onClick={onPlay}>
      <LuPlay aria-hidden size={16} />
      {plays ? "Putar lagi" : "Putar"}
    </Button>
    <Button disabled={disabled || !plays} onClick={onSlow}>
      <LuSnail aria-hidden size={16} />
      Pelan
    </Button>
    {plays > 1 && (
      <span className="text-[12.5px] font-bold text-ink-3 tabular-nums">
        diputar ulang {plays - 1}×
      </span>
    )}
  </div>
);

export default PlayButtons;
