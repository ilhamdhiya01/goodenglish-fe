"use client";

import classNames from "classnames";
import React, { useEffect, useState } from "react";
import { LuArrowUp } from "react-icons/lu";

import IconButton from "@/components/ui/icon-button";

// "Kembali ke atas" at the bottom right, above the phone's bottom nav; shows
// once the page has scrolled two screens down.
const ScrollTopButton = React.memo(() => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <IconButton
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={classNames(
        "fixed right-[max(16px,env(safe-area-inset-right))] bottom-[calc(84px+env(safe-area-inset-bottom))] z-20 transition-opacity duration-200 md:bottom-6",
        show ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <LuArrowUp aria-hidden size={18} />
    </IconButton>
  );
});

ScrollTopButton.displayName = "ScrollTopButton";

export default ScrollTopButton;
