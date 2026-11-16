"use client";

import classNames from "classnames";
import { useEffect, useState } from "react";
import type { Toast } from "react-hot-toast";
import toastLib from "react-hot-toast";

import Icon from "@/components/ui/icon/Icon";

import type { ToastAction, ToastVariant } from "./toast.config";
import { TOAST_ICONS } from "./toast.config";

interface ToastCardProps {
  t: Toast;
  variant: ToastVariant;
  title: string;
  description?: string;
  action?: ToastAction;
}

const ToastCard = ({
  t,
  variant,
  title,
  description,
  action,
}: ToastCardProps) => {
  // Mount dulu di state hidden, baru transisikan ke visible di effect
  // berikutnya — kalau class visible langsung dipasang saat mount, browser
  // tidak sempat commit paint pertama sehingga transition CSS tidak jalan
  // (toast muncul snap, bukan fade/slide smooth).
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const isVisible = entered && t.visible;

  const accentBarClass = classNames(
    "absolute inset-y-0 left-0 w-1 rounded-l-xl",
    {
      "bg-ok": variant === "success",
      "bg-bad": variant === "error",
      "bg-ink-2": variant === "warning",
      "bg-accent": variant === "info" || variant === "loading",
    },
  );

  const iconWrapClass = classNames(
    "flex h-6 w-6 flex-none items-center justify-center rounded-full",
    {
      "bg-ok-bg text-ok": variant === "success",
      "bg-bad-bg text-bad": variant === "error",
      "bg-sunken text-ink-2": variant === "warning",
      "bg-accent-tint text-accent-edge":
        variant === "info" || variant === "loading",
    },
  );

  const cardClass = classNames(
    "relative flex w-[360px] max-w-[calc(100vw-32px)] items-start gap-3 rounded-xl border-2 border-line bg-surface p-4 pr-10 shadow-overlay transition-all duration-300 ease-out",
    {
      "translate-y-0 opacity-100": isVisible,
      "-translate-y-2 opacity-0": !isVisible,
    },
  );

  const handleDismiss = () => toastLib.dismiss(t.id);

  return (
    <div role="status" onClick={handleDismiss} className={cardClass}>
      <span className={accentBarClass} />
      <span className={iconWrapClass}>
        <Icon
          icon={TOAST_ICONS[variant]}
          size={13}
          className={classNames({ "animate-spin": variant === "loading" })}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-ink">{title}</p>
        {description && (
          <p className="mt-1 text-[13px] text-ink-2">{description}</p>
        )}
        {action && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              handleDismiss();
            }}
            className="mt-2 rounded-sm text-[13px] font-extrabold text-accent-edge underline decoration-2 underline-offset-[3px] focus-ring"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="hit-44 absolute top-2.5 right-2.5 rounded-sm text-ink-2 focus-ring hover:text-ink"
      >
        <Icon icon="TbX" size={14} />
      </button>
    </div>
  );
};

export default ToastCard;
