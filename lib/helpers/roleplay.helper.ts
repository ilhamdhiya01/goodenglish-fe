import { CHEAT_SECTIONS } from "@/const/cheatsheet.constant";

/** "3 mnt 05 dtk" / "45 dtk". */
export const formatDuration = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? `${m} mnt ${String(r).padStart(2, "0")} dtk` : `${r} dtk`;
};

/** Cheat sheet section title of a correction category (its id). */
export const categoryTitle = (id: string) =>
  CHEAT_SECTIONS.find((c) => c.id === id)?.title ?? "Kesalahan umum";

/** "Senin, 16 Nov · 09.30" in Indonesian. */
export const formatSessionDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};
