"use client";

import classNames from "classnames";
import React, { forwardRef } from "react";

import { speak } from "@/lib/helpers/speech.helper";

import SpeakerIcon from "../speaker-icon";

interface SpeakButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button box size (px). */
  size?: number;
  /** Icon size (px). */
  icon?: number;
  /** When set, clicking speaks this text directly. */
  text?: string;
}

const SpeakButton = forwardRef<HTMLButtonElement, SpeakButtonProps>(
  (
    {
      size = 26,
      icon = 13,
      text,
      title = "Dengarkan",
      className,
      onClick,
      type = "button",
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      title={title}
      onClick={onClick || (text ? () => speak(text) : undefined)}
      className={classNames(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line-2 text-green transition-colors hover:border-green",
        className,
      )}
      style={{ width: size, height: size }}
      {...rest}
    >
      <SpeakerIcon size={icon} />
    </button>
  ),
);

SpeakButton.displayName = "SpeakButton";

export default SpeakButton;
