"use client";

import classNames from "classnames";
import React, { forwardRef } from "react";

import { speak } from "@/lib/helpers/speech.helper";
import { useSpeaking } from "@/lib/hooks/useSpeaking";

import SpeakerIcon from "../speaker-icon";

interface SpeakButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button box size (px). */
  size?: number;
  /** Icon size (px). */
  icon?: number;
  /** When set, clicking speaks this text directly. */
  text?: string;
  /** Inside another <button>: render a <span role="button"> instead (nested
   * buttons are invalid HTML) and keep the click from reaching the parent. */
  nested?: boolean;
}

// Round blue-tint speaker; filled blue while its text is being spoken. The
// touch area is at least 44px even when the visible circle is smaller.
const BASE =
  "hit-44 focus-ring inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors";
const IDLE = "bg-accent-tint text-accent hover:bg-accent-mark";
const PLAYING = "bg-accent text-on-accent";

const SpeakButton = forwardRef<HTMLButtonElement, SpeakButtonProps>(
  (
    {
      size = 36,
      icon = 16,
      text,
      nested,
      title = "Dengarkan",
      className,
      onClick,
      type = "button",
      ...rest
    },
    ref,
  ) => {
    const playing = useSpeaking(text);
    const cls = classNames(BASE, playing ? PLAYING : IDLE, className);
    if (nested) {
      const play = (e: React.SyntheticEvent) => {
        e.stopPropagation();
        if (text) speak(text);
      };
      return (
        <span
          role="button"
          tabIndex={0}
          title={title}
          aria-label={rest["aria-label"] ?? title}
          onClick={play}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            play(e);
          }}
          className={cls}
          style={{ width: size, height: size }}
        >
          <SpeakerIcon size={icon} />
        </span>
      );
    }
    return (
      <button
        ref={ref}
        type={type}
        title={title}
        aria-label={title}
        onClick={onClick || (text ? () => speak(text) : undefined)}
        className={cls}
        style={{ width: size, height: size }}
        {...rest}
      >
        <SpeakerIcon size={icon} />
      </button>
    );
  },
);

SpeakButton.displayName = "SpeakButton";

export default SpeakButton;
