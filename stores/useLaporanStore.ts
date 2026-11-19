import { create } from "zustand";

import type { Laporan } from "@/lib/rencana/rencana.contract";

// The activity log as this device knows it: the last days from the server
// plus what was reported here. Append-only, one entry per id. Rencana reads
// only this.

interface LaporanState {
  items: Laporan[];
  /** Server copy loaded at least once (before that, ticks may be missing). */
  dimuat: boolean;
  tambah: (l: Laporan) => void;
  gabung: (list: Laporan[], dimuat?: boolean) => void;
}

const gabungkan = (cur: Laporan[], more: Laporan[]) => {
  const ids = new Set(cur.map((l) => l.id));
  const add = more.filter((l) => l && !ids.has(l.id) && (ids.add(l.id), true));
  return add.length ? [...cur, ...add] : cur;
};

export const useLaporanStore = create<LaporanState>((set) => ({
  items: [],
  dimuat: false,
  tambah: (l) => set((s) => ({ items: gabungkan(s.items, [l]) })),
  gabung: (list, dimuat) =>
    set((s) => ({
      items: gabungkan(s.items, list),
      ...(dimuat ? { dimuat: true } : {}),
    })),
}));
