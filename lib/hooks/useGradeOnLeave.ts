import { useEffect, useRef } from "react";

/**
 * Ulang: once a checked answer's result is on screen, it counts even if the
 * learner leaves before Lanjut (another page, reload, closed tab), so the
 * card can't be answered again with the answer already seen.
 *
 * `id`: the card whose result is showing, or null while there is none.
 * `grade`: applies its rating. Returns `settle`, for Lanjut: true the first
 * time for a card (apply the rating then), false if it was already applied.
 */
export const useGradeOnLeave = (id: string | null, grade: () => void) => {
  const pending = useRef<{ id: string; grade: () => void } | null>(null);
  const settled = useRef("");
  useEffect(() => {
    pending.current = id && id !== settled.current ? { id, grade } : null;
  });
  useEffect(() => {
    const flush = () => {
      const p = pending.current;
      pending.current = null;
      if (!p) return;
      settled.current = p.id;
      p.grade();
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);
  return () => {
    if (!id || settled.current === id) return false;
    settled.current = id;
    pending.current = null;
    return true;
  };
};
