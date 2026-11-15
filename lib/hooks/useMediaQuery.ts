import { useSyncExternalStore } from "react";

/** Whether a CSS media query matches now (false where matchMedia is missing). */
export const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const m = window.matchMedia(query);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => typeof window !== "undefined" && !!window.matchMedia?.(query).matches,
    () => false,
  );
