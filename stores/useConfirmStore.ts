import { create } from "zustand";

// Pengganti window.confirm yang sesuai tema: confirmDialog() membuka
// <ConfirmDialog> (dipasang sekali di app/layout.tsx) dan resolve true kalau
// pengguna menekan tombol konfirmasi, false kalau batal / Escape / klik di luar.

export interface ConfirmOptions {
  title: string;
  /** Penjelasan di bawah judul: apa akibatnya. */
  message?: string;
  /** Default "Ya". */
  confirmLabel?: string;
  /** Default "Batal". */
  cancelLabel?: string;
  /** danger = aksi yang menghapus / tidak bisa dibatalkan (tombol merah). */
  tone?: "danger" | "primary";
}

interface ConfirmState {
  request: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null;
  ask: (opts: ConfirmOptions) => Promise<boolean>;
  settle: (ok: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,
  ask: (opts) =>
    new Promise<boolean>((resolve) => {
      // Satu dialog saja: permintaan yang masih terbuka dianggap batal.
      get().request?.resolve(false);
      set({ request: { ...opts, resolve } });
    }),
  settle: (ok) => {
    get().request?.resolve(ok);
    set({ request: null });
  },
}));

export const confirmDialog = (opts: ConfirmOptions) =>
  useConfirmStore.getState().ask(opts);
