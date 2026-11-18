import type { IconType } from "react-icons";
import {
  LuAlignLeft,
  LuAudioLines,
  LuBookOpen,
  LuBookOpenText,
  LuChartLine,
  LuClipboardList,
  LuFileText,
  LuHeadphones,
  LuMessageSquare,
  LuRotateCcw,
  LuTriangleAlert,
} from "react-icons/lu";

import type { MenuId } from "@/lib/types/session.types";

export interface NavItem {
  id: Exclude<MenuId, "ai">;
  path: string;
  label: string;
  icon: IconType;
}

// The eight menus, in order. One source for the sidebar, the icon rail, the
// phone bottom nav and its "Lainnya" sheet. The path equals the MenuId.
export const NAV: NavItem[] = [
  { id: "plan", path: "/plan", label: "Rencana", icon: LuClipboardList },
  { id: "vocab", path: "/vocab", label: "Kosakata", icon: LuBookOpen },
  { id: "review", path: "/review", label: "Ulang", icon: LuRotateCcw },
  {
    id: "scenario",
    path: "/scenario",
    label: "Skenario",
    icon: LuMessageSquare,
  },
  {
    id: "errors",
    path: "/errors",
    label: "Kesalahan umum",
    icon: LuTriangleAlert,
  },
  {
    id: "grammar",
    path: "/grammar",
    label: "Panduan grammar",
    icon: LuAlignLeft,
  },
  {
    id: "pronunciation",
    path: "/pronunciation",
    label: "Pelafalan",
    icon: LuAudioLines,
  },
  {
    id: "listening",
    path: "/listening",
    label: "Menyimak",
    icon: LuHeadphones,
  },
  {
    id: "reading",
    path: "/reading",
    label: "Bacaan",
    icon: LuBookOpenText,
  },
  {
    id: "progress",
    path: "/progress",
    label: "Progres",
    icon: LuChartLine,
  },
  {
    id: "cheatsheet",
    path: "/cheatsheet",
    label: "Cheat sheet",
    icon: LuFileText,
  },
];

/** Bottom-nav slots on a phone before the rest goes into "Lainnya". */
export const BOTTOM_NAV_SLOTS = 4;

export const isActivePath = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(path + "/");
