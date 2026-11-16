import classNames from "classnames";
import React from "react";

type LogoProps = {
  variant?: "horizontal" | "stacked" | "mark";
  /** Height of the mark: 28 / 38 / 58 px. */
  size?: "sm" | "md" | "lg";
  /** On a dark or blue background. */
  onDark?: boolean;
  className?: string;
};

// The mark is 1:1 (public/brand/logo-mark*.svg); the name is 0.68× its
// height and sits 0.26× its height away.
const SIZES = {
  sm: { mark: 28, text: "text-[19px]", gap: "gap-[7px]" },
  md: { mark: 38, text: "text-[26px]", gap: "gap-[10px]" },
  lg: { mark: 58, text: "text-[39px]", gap: "gap-[15px]" },
} as const;

/**
 * GoodEnglish logo: Jalak's face and the name as real text, so it stays sharp
 * and screen readers say "GoodEnglish" once. The face is decoration next to
 * the name; on its own (`mark`) it carries the name itself.
 */
const Logo = ({
  variant = "horizontal",
  size = "md",
  onDark = false,
  className,
}: LogoProps) => {
  const s = SIZES[size];
  const mark = (
    // A static file, not inline SVG: nothing added to the JS bundle.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={onDark ? "/brand/logo-mark-on-dark.svg" : "/brand/logo-mark.svg"}
      width={s.mark}
      height={s.mark}
      alt={variant === "mark" ? "GoodEnglish" : ""}
      aria-hidden={variant === "mark" ? undefined : true}
      className="block shrink-0"
    />
  );
  if (variant === "mark")
    return <span className={classNames("inline-flex", className)}>{mark}</span>;

  return (
    <span
      className={classNames(
        "inline-flex items-center",
        variant === "stacked" && "flex-col",
        s.gap,
        className,
      )}
    >
      {mark}
      <span
        className={classNames(
          "leading-none font-black tracking-[-0.02em] whitespace-nowrap",
          s.text,
          onDark ? "text-on-accent" : "text-ink",
        )}
      >
        Good
        <span className={onDark ? "text-accent-on-dark" : "text-accent"}>
          English
        </span>
      </span>
    </span>
  );
};

export default Logo;
