import classNames from "classnames";
import React, { forwardRef } from "react";

// Underlined text action ("Batal", "Tutup", "reset", "hapus") for small
// actions inside text that aren't full buttons. muted and green look the
// same (blue); red is for destructive ones.
interface TextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: "muted" | "green" | "red";
  children: React.ReactNode;
}

const TextButton = forwardRef<HTMLButtonElement, TextButtonProps>(
  ({ tone = "muted", className, type = "button", children, ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={classNames(
        "cursor-pointer rounded-sm bg-transparent p-0 text-[13px] leading-snug font-extrabold underline decoration-2 underline-offset-[3px] focus-ring transition-colors disabled:cursor-not-allowed disabled:text-ink-3",
        tone === "red"
          ? "text-bad decoration-bad-line hover:decoration-bad"
          : "text-accent-edge decoration-accent-line hover:decoration-accent-edge",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  ),
);

TextButton.displayName = "TextButton";

export default TextButton;
