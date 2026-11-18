import { usePathname } from "next/navigation";

import { BOTTOM_NAV_SLOTS, isActivePath, NAV } from "@/const/nav.constant";
import { useShellData } from "@/lib/hooks/useShellData";
import { useAccessStore } from "@/stores/useAccessStore";

// The menus this token may open, which one is active, and the "Ulang" badge
// (word and mistake cards due for review). On a phone the first four go in the bottom nav and
// the rest in "Lainnya" — unless there are four or fewer, then all fit.
export const useNavItems = () => {
  const pathname = usePathname();
  const menus = useAccessStore((s) => s.session?.menus);
  const { dueKeys, dueMistakes } = useShellData();
  const due = dueKeys.length + dueMistakes.length;

  const items = NAV.filter((n) => menus?.includes(n.id)).map((n) => ({
    ...n,
    active: isActivePath(pathname, n.path),
    badge: n.id === "review" ? due : 0,
  }));
  const fitsBottom = items.length <= BOTTOM_NAV_SLOTS;
  const bottom = fitsBottom ? items : items.slice(0, BOTTOM_NAV_SLOTS);
  const more = fitsBottom ? [] : items.slice(BOTTOM_NAV_SLOTS);

  return { items, bottom, more, fitsBottom };
};

export type NavEntry = ReturnType<typeof useNavItems>["items"][number];
