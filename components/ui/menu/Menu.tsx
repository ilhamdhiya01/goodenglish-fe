"use client";

import classNames from "classnames";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

// Popover menu (the ⋯ account menu, token row actions, level picker on
// desktop). Arrow keys move between items, Home/End jump, Escape closes and
// returns focus to the button, and a click outside or Tab closes it.

interface TriggerProps {
  ref: React.Ref<HTMLButtonElement>;
  id: string;
  "aria-haspopup": "menu";
  "aria-expanded": boolean;
  "aria-controls": string;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

interface MenuProps {
  /** Accessible name of the list. */
  label: string;
  /** Renders the opening button; spread the props onto it. */
  button: (props: TriggerProps) => React.ReactNode;
  align?: "start" | "end";
  className?: string;
  children: React.ReactNode;
}

const CloseContext = createContext<() => void>(() => {});

const items = (list: HTMLElement | null) => [
  ...(list?.querySelectorAll<HTMLElement>(
    '[role="menuitem"]:not([aria-disabled="true"])',
  ) ?? []),
];

const Menu = ({
  label,
  button,
  align = "end",
  className,
  children,
}: MenuProps) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const triggerId = useId();
  const listId = useId();
  const focusFirst = useRef<"first" | "last" | null>(null);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  // Move focus into the list once it has rendered.
  useEffect(() => {
    if (!open) return;
    const list = items(listRef.current);
    const target =
      focusFirst.current === "last" ? list[list.length - 1] : list[0];
    target?.focus();
    focusFirst.current = null;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, close]);

  const onListKey = (e: React.KeyboardEvent) => {
    const list = items(listRef.current);
    const i = list.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      list[(n + list.length) % list.length]?.focus();
    };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") close(false);
  };

  return (
    <div ref={wrapRef} className={classNames("relative", className)}>
      {button({
        ref: triggerRef,
        id: triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": listId,
        onClick: () => setOpen((o) => !o),
        onKeyDown: (e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            focusFirst.current = e.key === "ArrowUp" ? "last" : "first";
            setOpen(true);
          }
        },
      })}
      {open && (
        <div
          ref={listRef}
          id={listId}
          role="menu"
          aria-label={label}
          onKeyDown={onListKey}
          className={classNames(
            "absolute top-[calc(100%+8px)] z-40 flex max-h-[min(70vh,480px)] min-w-[220px] animate-[fade-in_120ms_var(--ease-lompat)] flex-col overflow-y-auto rounded-xl border-2 border-line bg-surface p-1.5 shadow-overlay",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          <CloseContext.Provider value={close}>
            {children}
          </CloseContext.Provider>
        </div>
      )}
    </div>
  );
};

interface MenuItemProps {
  onSelect: () => void;
  tone?: "default" | "bad";
  disabled?: boolean;
  /** Small second line under the label. */
  hint?: React.ReactNode;
  children: React.ReactNode;
}

const MenuItem = ({
  onSelect,
  tone = "default",
  disabled,
  hint,
  children,
}: MenuItemProps) => {
  const close = useContext(CloseContext);
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (disabled) return;
        close();
        onSelect();
      }}
      className={classNames(
        "flex min-h-11 w-full cursor-pointer flex-col items-start justify-center rounded-md px-3 py-2 text-left text-sm font-extrabold outline-none focus:bg-accent-tint aria-disabled:cursor-not-allowed aria-disabled:text-ink-3",
        tone === "bad" ? "text-bad" : "text-ink hover:bg-sunken",
      )}
    >
      {children}
      {hint && (
        <span className="text-[12.5px] leading-[18px] font-bold text-ink-2">
          {hint}
        </span>
      )}
    </button>
  );
};

const MenuSeparator = () => (
  <div role="separator" className="mx-1.5 my-1 h-0.5 bg-line" />
);

Menu.Item = MenuItem;
Menu.Separator = MenuSeparator;

export default Menu;
