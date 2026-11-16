import classNames from "classnames";
import Link from "next/link";
import React from "react";

interface ListItemProps {
  active?: boolean;
  /** Navigates (grammar sections, cheat sheet parts); otherwise a button. */
  href?: string;
  onClick?: () => void;
  /** Right-hand meta: "86/214", a ✓, "segera". */
  trailing?: React.ReactNode;
  /** Muted (week not available yet). */
  muted?: boolean;
  className?: string;
  children: React.ReactNode;
}

// One row of a side list (weeks, grammar sections, cheat sheet contents,
// scenarios, error categories). The active row is tinted and marked
// aria-current, so it isn't told by color alone.
const ListItem = ({
  active = false,
  href,
  onClick,
  trailing,
  muted = false,
  className,
  children,
}: ListItemProps) => {
  const cls = classNames(
    "flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-md border-2 px-3 py-2 text-left text-sm leading-5 font-extrabold no-underline focus-ring transition-colors",
    active
      ? "border-accent-line bg-accent-tint text-accent-edge"
      : classNames(
          "border-transparent hover:bg-sunken",
          muted ? "text-ink-3" : "text-ink",
        ),
    className,
  );
  const body = (
    <>
      <span className="min-w-0">{children}</span>
      {trailing != null && (
        <span
          className={classNames(
            "shrink-0 text-xs font-bold tabular-nums",
            active ? "text-accent-edge" : "text-ink-3",
          )}
        >
          {trailing}
        </span>
      )}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cls}
      >
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-current={active ? "true" : undefined}
      onClick={onClick}
      className={cls}
    >
      {body}
    </button>
  );
};

export default ListItem;
