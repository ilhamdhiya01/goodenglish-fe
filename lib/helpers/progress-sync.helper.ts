import type {
  ProgressKey,
  ProgressMap,
  ProgressVersions,
} from "@/lib/types/progress-sync.types";
import { API_PROGRESS_KEY, ROUTES } from "@/routes";
import {
  getProgress,
  getProgressDoc,
  putProgress,
} from "@/services/progress.service";

// Debounced write-behind for progress documents. Stores call save() as often
// as they like (every card tap); each document is PUT at most once per
// DEBOUNCE_MS with its latest value. Failed writes stay queued and retry.
//
// Two devices (or tabs) of one token: every save carries the version this
// device last saw. When another device saved in between, the server answers
// 409; this device then fetches the server copy, merges both changes
// (progress-merge.helper), shows the result and saves that instead — nobody
// overwrites the other.
//
// Saves still queued when the tab is hidden or closed are also kept in
// localStorage (the outbox) and sent on the next start, so closing the tab
// right after answering a card doesn't lose it.

const DEBOUNCE_MS = 800;
const RETRY_MS = 5000;
const MAX_CONFLICT_RETRIES = 3;
/** fetch keepalive allows 64 KB in flight for the whole page. */
const KEEPALIVE_MAX_BYTES = 60_000;
export const OUTBOX_KEY = "ge-progress-outbox-v1";

interface Base {
  /** Last value the server confirmed (the merge base). */
  data: unknown;
  /** Its version; null = the server has no document yet. */
  version: number | null;
}

interface OutboxItem {
  data: unknown;
  /** undefined: saved by a client that had no versions. */
  baseVersion?: number | null;
}

interface Outbox {
  owner: string;
  items: Partial<Record<ProgressKey, OutboxItem>>;
}

/** How the stores are read and refreshed (set by progress-hydrate). */
export interface ProgressSyncHooks {
  /** The document as this device holds it now (newest local value). */
  current: (key: ProgressKey) => unknown;
  /** Show a merged / refreshed document without saving it again. */
  apply: (key: ProgressKey, value: unknown) => void;
  today: () => number;
  /** Three-way merge (progress-merge.helper; injected to keep the stores
   * out of this module's imports). */
  merge: (
    key: ProgressKey,
    base: unknown,
    mine: unknown,
    theirs: unknown,
    T: number,
  ) => unknown;
}

const pending = new Map<ProgressKey, unknown>();
/** Taken from `pending` by the running flush, not yet confirmed. */
const inflight = new Map<ProgressKey, unknown>();
const base = new Map<ProgressKey, Base>();
let versioned = false;
let owner = "";
let hooks: ProgressSyncHooks | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let chain: Promise<void> = Promise.resolve();

export const configureProgressSync = (h: ProgressSyncHooks) => {
  hooks = h;
};

const schedule = (ms: number) => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flushProgress();
  }, ms);
};

export const queueProgress = (key: ProgressKey, data: unknown) => {
  pending.set(key, data);
  schedule(DEBOUNCE_MS);
};

export const hasPendingProgress = () => pending.size > 0 || inflight.size > 0;

const statusOf = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status;

const goToAccess = () => {
  if (typeof window !== "undefined") window.location.href = ROUTES.ACCESS;
};

// ---- outbox ---------------------------------------------------------------

const readOutbox = (): Outbox | null => {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Outbox;
    return o && typeof o.owner === "string" && o.items ? o : null;
  } catch {
    return null;
  }
};

const clearOutbox = () => {
  try {
    const o = readOutbox();
    // Another token's leftovers stay for that token.
    if (o && o.owner === owner) localStorage.removeItem(OUTBOX_KEY);
  } catch {
    /* ignore */
  }
};

const baseVersionOf = (key: ProgressKey) =>
  versioned ? (base.get(key)?.version ?? null) : undefined;

/** Keep what isn't confirmed yet on the device (tab hidden / closing). */
export const writeOutbox = () => {
  if (!owner) return;
  const items: Outbox["items"] = {};
  for (const [k, d] of [...inflight, ...pending]) {
    items[k] = { data: d, baseVersion: baseVersionOf(k) };
  }
  try {
    if (!Object.keys(items).length) return clearOutbox();
    localStorage.setItem(OUTBOX_KEY, JSON.stringify({ owner, items }));
  } catch {
    /* full / private mode: the keepalive send is the last chance */
  }
};

// ---- start ----------------------------------------------------------------

/**
 * Remember what the server holds (the merge base) and fold in this token's
 * saves left on the device by a closed tab. Returns the documents to show
 * and the keys that still have to be sent (queue them with queueReplay once
 * the stores are filled).
 */
export const startProgressSync = (
  docs: ProgressMap,
  versions: ProgressVersions | null,
  tokenOwner: string,
): { map: ProgressMap; replay: ProgressKey[] } => {
  owner = tokenOwner;
  versioned = !!versions;
  base.clear();
  if (versions) {
    for (const [k, data] of Object.entries(docs) as [ProgressKey, unknown][]) {
      base.set(k, { data, version: versions[k] ?? null });
    }
  }
  const map: ProgressMap = { ...docs };
  const replay: ProgressKey[] = [];
  const out = owner && hooks ? readOutbox() : null;
  if (hooks && out && out.owner === owner) {
    const T = hooks.today();
    for (const [k, item] of Object.entries(out.items) as [
      ProgressKey,
      OutboxItem | undefined,
    ][]) {
      if (!item) continue;
      const serverVersion = versions?.[k] ?? null;
      const untouched =
        item.baseVersion !== undefined && item.baseVersion === serverVersion;
      // Nobody saved since: the device copy is simply newer. Otherwise merge
      // without a base (both kept, counters not added twice).
      map[k] = untouched
        ? item.data
        : hooks.merge(k, undefined, item.data, docs[k], T);
      replay.push(k);
    }
  }
  return { map, replay };
};

export const queueReplay = (keys: ProgressKey[]) => {
  if (!hooks) return;
  for (const k of keys) queueProgress(k, hooks.current(k));
};

// ---- flush ----------------------------------------------------------------

class Unauthorized extends Error {}

/** PUT one document; on 409 merge with the server copy and try again. */
const sendDoc = async (key: ProgressKey, data: unknown) => {
  let mine = data;
  for (let attempt = 0; ; attempt++) {
    const baseVersion = baseVersionOf(key);
    try {
      const res =
        baseVersion === undefined
          ? await putProgress(key, mine)
          : await putProgress(key, mine, baseVersion);
      const version = res?.data?.version;
      if (versioned && typeof version === "number")
        base.set(key, { data: mine, version });
      return;
    } catch (error) {
      const status = statusOf(error);
      if (status === 401) throw new Unauthorized();
      if (status !== 409 || !hooks || attempt >= MAX_CONFLICT_RETRIES - 1)
        throw error;
      const server = await getProgressDoc(key);
      // The newest local value: the store may have moved on while waiting.
      const local = hooks.current(key) ?? mine;
      const merged = hooks.merge(
        key,
        base.get(key)?.data,
        local,
        server.data,
        hooks.today(),
      );
      base.set(key, { data: server.data, version: server.version });
      // The merged value already holds every local change.
      pending.delete(key);
      hooks.apply(key, merged);
      mine = merged;
    }
  }
};

const runFlush = async () => {
  if (!pending.size) return;
  const batch = [...pending.entries()];
  pending.clear();
  batch.forEach(([k, d]) => inflight.set(k, d));

  // Keep the newest value if the store changed it meanwhile.
  const requeue = ([k, d]: [ProgressKey, unknown]) => {
    if (!pending.has(k)) pending.set(k, hooks?.current(k) ?? d);
    inflight.delete(k);
  };

  for (let i = 0; i < batch.length; i++) {
    const [key, data] = batch[i];
    try {
      await sendDoc(key, data);
      inflight.delete(key);
    } catch (error) {
      if (error instanceof Unauthorized) {
        // Session gone: nothing of this batch is dropped. It stays on the
        // device and is sent after signing in again with this token.
        batch.slice(i).forEach(requeue);
        writeOutbox();
        goToAccess();
        return;
      }
      requeue([key, data]);
      schedule(RETRY_MS);
    }
  }
  if (!pending.size && !inflight.size) clearOutbox();
};

/** Send everything queued now. Flushes never overlap: each waits its turn. */
export const flushProgress = (): Promise<void> => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  chain = chain.then(runFlush, runFlush);
  return chain;
};

/**
 * Tab shown again: pick up what another device saved meanwhile. Documents
 * with local changes waiting are left alone (their save merges on 409).
 */
export const refreshProgress = (): Promise<void> => {
  const run = async () => {
    if (!versioned || !hooks) return;
    let fresh;
    try {
      fresh = (await getProgress()).data;
    } catch {
      return;
    }
    if (!fresh?.versions) return;
    for (const [k, version] of Object.entries(fresh.versions) as [
      ProgressKey,
      number,
    ][]) {
      if (base.get(k)?.version === version) continue;
      if (pending.has(k) || inflight.has(k)) continue;
      base.set(k, { data: fresh.docs[k], version });
      hooks.apply(k, fresh.docs[k]);
    }
  };
  chain = chain.then(run, run);
  return chain;
};

// Last-chance write when the tab is closed: fetch with keepalive outlives
// the page, unlike axios/XHR. Only when small enough and online; the queue
// is kept (the page may come back from the back/forward cache) and the
// outbox covers a send that never arrives.
export const flushProgressOnExit = () => {
  writeOutbox();
  if (!pending.size) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  const bodies = [...pending].map(([key, data]) => {
    const baseVersion = baseVersionOf(key);
    return [
      key,
      JSON.stringify(
        baseVersion === undefined ? { data } : { data, baseVersion },
      ),
    ] as const;
  });
  const total = bodies.reduce((n, [, b]) => n + b.length, 0);
  if (total >= KEEPALIVE_MAX_BYTES) return;
  for (const [key, body] of bodies) {
    void fetch(API_PROGRESS_KEY(key), {
      method: "PUT",
      credentials: "include",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => {});
  }
};

/** Tab hidden: a normal save (kept queued if it fails) plus the outbox. */
export const flushProgressOnHide = () => {
  writeOutbox();
  void flushProgress();
};

// Back online: send what piled up right away instead of at the next retry.
if (typeof window !== "undefined") {
  window.addEventListener("online", () => void flushProgress());
}

/** Tests only. */
export const __resetProgressSync = () => {
  pending.clear();
  inflight.clear();
  base.clear();
  versioned = false;
  owner = "";
  hooks = null;
  if (timer) clearTimeout(timer);
  timer = null;
  chain = Promise.resolve();
};
