import type { ProgressKey } from "@/lib/types/progress-sync.types";
import { API_PROGRESS_KEY, ROUTES } from "@/routes";
import { putProgress } from "@/services/progress.service";

// Debounced write-behind for progress documents. Stores call save() as often
// as they like (every card tap); each document is PUT at most once per
// DEBOUNCE_MS with its latest value. Failed writes stay queued and retry.

const DEBOUNCE_MS = 800;
const RETRY_MS = 5000;

const pending = new Map<ProgressKey, unknown>();
let timer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<void> | null = null;

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

export const hasPendingProgress = () => pending.size > 0;

const goToAccess = () => {
  if (typeof window !== "undefined") window.location.href = ROUTES.ACCESS;
};

export const flushProgress = async (): Promise<void> => {
  if (flushing) await flushing;
  if (!pending.size) return;
  const batch = [...pending.entries()];
  pending.clear();

  flushing = (async () => {
    for (const [key, data] of batch) {
      try {
        await putProgress(key, data);
      } catch (error) {
        const status = (error as { response?: { status?: number } }).response
          ?.status;
        if (status === 401) return goToAccess();
        // Keep the newest value if the store changed it meanwhile.
        if (!pending.has(key)) pending.set(key, data);
        schedule(RETRY_MS);
      }
    }
  })();
  try {
    await flushing;
  } finally {
    flushing = null;
  }
};

// Last-chance write when the tab is hidden or closed: fetch with keepalive
// outlives the page, unlike axios/XHR.
export const flushProgressOnExit = () => {
  if (!pending.size) return;
  for (const [key, data] of pending) {
    void fetch(API_PROGRESS_KEY(key), {
      method: "PUT",
      credentials: "include",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
  }
  pending.clear();
};
