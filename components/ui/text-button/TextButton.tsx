import classNames from "classnames";
import React, { forwardRef } from "react";

// Dotted-underline text action ("Batal", "Tutup", "reset", "hapus") for
// secondary actions that aren't full buttons.
interface TextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: "muted" | "green" | "red";
  children: React.ReactNode;
}

const TextButton = forwardRef<HTMLButtonElement, TextButtonProps>(
  ({ tone = "muted", className, type = "button", children, ...rest }, ref) => {
    const c =
      tone === "green"
        ? "text-green border-green"
        : tone === "red"
          ? "text-red border-red"
          : "text-muted border-faint";
    return (
      <button
        ref={ref}
        type={type}
        className={classNames(
          "cursor-pointer border-b border-dotted bg-transparent p-0 text-[12.5px] leading-snug transition-colors",
          c,
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

TextButton.displayName = "TextButton";

export default TextButton;
