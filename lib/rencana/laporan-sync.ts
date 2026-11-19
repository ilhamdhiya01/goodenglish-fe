import { RENCANA } from "@/const/rencana.config";
import type { Laporan } from "@/lib/rencana/rencana.contract";
import { getLaporan, postLaporan } from "@/services/laporan.service";
import { useLaporanStore } from "@/stores/useLaporanStore";

// Sends reports to the server in small batches. Until confirmed they stay
// in a queue that is also kept in localStorage (the outbox), so a closed
// tab or a dead connection doesn't lose them; the next start sends them.
// Nothing is sent before startLaporan() (the session is known by then).

export const LAPORAN_OUTBOX_KEY = "ge-laporan-outbox-v1";
const SEND_MS = 1000;
const RETRY_MS = 10_000;

let owner = "";
let queue: Laporan[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let sending: Promise<void> | null = null;

// One outbox per token, so another token on this browser never touches it.
const outboxKey = () => `${LAPORAN_OUTBOX_KEY}:${owner}`;

const writeOutbox = () => {
  if (!owner) return;
  try {
    if (queue.length) localStorage.setItem(outboxKey(), JSON.stringify(queue));
    else localStorage.removeItem(outboxKey());
  } catch {
    /* full / private mode */
  }
};

const readOutbox = (): Laporan[] => {
  try {
    const o = JSON.parse(localStorage.getItem(outboxKey()) || "null");
    return Array.isArray(o) ? o : [];
  } catch {
    return [];
  }
};

const schedule = (ms: number) => {
  if (!owner) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void kirimLaporan();
  }, ms);
};

/** Queue one report (already in the store). */
export const antreLaporan = (l: Laporan) => {
  queue.push(l);
  writeOutbox();
  schedule(SEND_MS);
};

export const kirimLaporan = async (): Promise<void> => {
  if (!owner || !queue.length) return;
  if (sending) return sending;
  sending = (async () => {
    while (queue.length) {
      const batch = queue.slice(0, RENCANA.laporanPerKirim);
      try {
        await postLaporan(batch);
      } catch {
        schedule(RETRY_MS);
        return;
      }
      const sent = new Set(batch.map((b) => b.id));
      queue = queue.filter((q) => !sent.has(q.id));
      writeOutbox();
    }
  })();
  try {
    await sending;
  } finally {
    sending = null;
  }
};

/** Last days from the server into the store (also when the tab returns). */
export const muatLaporan = async (T: number) => {
  try {
    const r = await getLaporan(T - RENCANA.laporanDimuatHari);
    useLaporanStore.getState().gabung(r.data ?? [], true);
  } catch {
    /* offline: what this device has still counts */
  }
};

/**
 * Start for this token: reports a closed tab left behind are put back in the
 * store and sent; the server copy is loaded.
 */
export const startLaporan = async (tokenOwner: string, T: number) => {
  owner = tokenOwner;
  const left = readOutbox();
  if (left.length) {
    const ids = new Set(queue.map((q) => q.id));
    queue = [...queue, ...left.filter((l) => !ids.has(l.id))];
    useLaporanStore.getState().gabung(left);
  }
  writeOutbox();
  void kirimLaporan();
  await muatLaporan(T);
};

/** Tab hidden / closing: keep the queue on the device. */
export const simpanAntreLaporan = () => writeOutbox();

/** Tests only. */
export const __resetLaporanSync = () => {
  owner = "";
  queue = [];
  if (timer) clearTimeout(timer);
  timer = null;
  sending = null;
};
