"use client";

import classNames from "classnames";
import React, { useEffect, useState } from "react";

// Tombol "kembali ke atas" mengambang di kanan bawah; muncul setelah scroll jauh.
const ScrollTopButton = React.memo(() => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={classNames(
        "fixed right-[max(16px,env(safe-area-inset-right))] bottom-[max(20px,env(safe-area-inset-bottom))] z-30 inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-ink bg-ink text-paper shadow-[0_8px_24px_rgba(29,27,22,.22)] transition-all duration-200 hover:bg-ink-4",
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5m0 0l-6 6m6-6l6 6" />
      </svg>
    </button>
  );
});

ScrollTopButton.displayName = "ScrollTopButton";

export default ScrollTopButton;
