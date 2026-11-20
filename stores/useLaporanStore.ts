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
  /** dimuat: `list` is the server copy (then the order is rebuilt). */
  gabung: (list: Laporan[], dimuat?: boolean) => void;
}

const gabungkan = (cur: Laporan[], more: Laporan[]) => {
  const ids = new Set(cur.map((l) => l.id));
  const add = more.filter((l) => l && !ids.has(l.id) && (ids.add(l.id), true));
  return add.length ? [...cur, ...add] : cur;
};

// The server copy (oldest first) followed by what it doesn't have yet, kept
// in day order: Rencana reads "the latest" report as the last one, so a
// report left in the outbox must stay after the older server ones.
const dariServer = (cur: Laporan[], server: Laporan[]) => {
  const list = server.filter(Boolean);
  const ids = new Set(list.map((l) => l.id));
  const rest = cur.filter((l) => !ids.has(l.id));
  // sort is stable: within a day the server order, then this device's.
  return [...list, ...rest].sort((a, b) => a.day - b.day);
};

export const useLaporanStore = create<LaporanState>((set) => ({
  items: [],
  dimuat: false,
  tambah: (l) => set((s) => ({ items: gabungkan(s.items, [l]) })),
  gabung: (list, dimuat) =>
    set((s) => ({
      items: dimuat ? dariServer(s.items, list) : gabungkan(s.items, list),
      ...(dimuat ? { dimuat: true } : {}),
    })),
}));
