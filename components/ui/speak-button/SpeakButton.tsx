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
  /** Inside another <button>: render a <span role="button"> instead (nested
   * buttons are invalid HTML) and keep the click from reaching the parent. */
  nested?: boolean;
}

const BASE =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line-2 text-green transition-colors hover:border-green";

const SpeakButton = forwardRef<HTMLButtonElement, SpeakButtonProps>(
  (
    {
      size = 26,
      icon = 13,
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
          onClick={play}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            play(e);
          }}
          className={classNames(BASE, className)}
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
        onClick={onClick || (text ? () => speak(text) : undefined)}
        className={classNames(BASE, className)}
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
