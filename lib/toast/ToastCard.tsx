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
    "absolute inset-y-0 left-0 w-[2px] rounded-l-lg",
    {
      "bg-green": variant === "success",
      "bg-red": variant === "error",
      "bg-orange": variant === "warning",
      "bg-blue": variant === "info" || variant === "loading",
    },
  );

  const iconWrapClass = classNames(
    "flex h-6 w-6 flex-none items-center justify-center rounded-full border",
    {
      "border-green-line bg-green-bg text-green": variant === "success",
      "border-red-line bg-red-bg text-red": variant === "error",
      "border-line bg-sand text-orange": variant === "warning",
      "border-line bg-sand text-blue":
        variant === "info" || variant === "loading",
    },
  );

  const cardClass = classNames(
    "relative flex w-[360px] items-start gap-3 rounded-lg border-[1.5px] border-ink bg-card p-4 pr-9 shadow-lg transition-all duration-300 ease-out",
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
        <p className="text-[13.5px] font-semibold text-ink">{title}</p>
        {description && (
          <p className="mt-1 text-[12.5px] text-muted">{description}</p>
        )}
        {action && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              handleDismiss();
            }}
            className="mt-2 text-[12.5px] font-semibold text-green underline underline-offset-2"
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
        className="absolute top-2.5 right-2.5 text-faint hover:text-ink"
      >
        <Icon icon="TbX" size={14} />
      </button>
    </div>
  );
};

export default ToastCard;
