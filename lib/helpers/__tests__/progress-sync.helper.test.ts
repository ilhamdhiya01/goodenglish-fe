import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const putProgress = vi.fn();
const getProgressDoc = vi.fn();
const getProgress = vi.fn();
vi.mock("@/services/progress.service", () => ({
  putProgress,
  getProgressDoc,
  getProgress,
}));

const {
  __resetProgressSync,
  configureProgressSync,
  flushProgress,
  flushProgressOnExit,
  hasPendingProgress,
  OUTBOX_KEY,
  queueProgress,
  refreshProgress,
  startProgressSync,
  writeOutbox,
} = await import("../progress-sync.helper");
const { mergeProgressDoc } = await import("../progress-merge.helper");

const T = 20_000;
const conflict = { response: { status: 409 } };

// A tiny stand-in for the snapshot + stores.
const setupDevice = (docs: Record<string, unknown> = {}) => {
  const local: Record<string, unknown> = { ...docs };
  const applied: [string, unknown][] = [];
  configureProgressSync({
    current: (k) => local[k],
    apply: (k, v) => {
      local[k] = v;
      applied.push([k, v]);
    },
    today: () => T,
    merge: mergeProgressDoc,
  });
  const save = (k: "known" | "plan" | "srs" | "own", v: unknown) => {
    local[k] = v;
    queueProgress(k, v);
  };
  return { local, applied, save };
};

describe("progress-sync.helper", () => {
  beforeEach(() => {
    __resetProgressSync();
    localStorage.clear();
    setupDevice();
    vi.useFakeTimers();
    putProgress.mockReset().mockResolvedValue({ data: { version: 2 } });
    getProgressDoc.mockReset();
    getProgress.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces: one PUT per document with its latest value", async () => {
    queueProgress("known", { a: 1 });
    queueProgress("known", { a: 1, b: 1 });
    queueProgress("plan", { rule: "r1" });

    await vi.advanceTimersByTimeAsync(800);

    expect(putProgress).toHaveBeenCalledTimes(2);
    expect(putProgress).toHaveBeenCalledWith("known", { a: 1, b: 1 });
    expect(putProgress).toHaveBeenCalledWith("plan", { rule: "r1" });
    expect(hasPendingProgress()).toBe(false);
  });

  it("keeps a failed write queued and retries it", async () => {
    putProgress
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValue({ data: null });

    queueProgress("srs", { k: { st: 1, due: 2 } });
    await vi.advanceTimersByTimeAsync(800);
    expect(hasPendingProgress()).toBe(true);

    await vi.advanceTimersByTimeAsync(5000);
    expect(putProgress).toHaveBeenCalledTimes(2);
    expect(hasPendingProgress()).toBe(false);
  });

  it("flushes immediately on demand (e.g. before logout)", async () => {
    queueProgress("own", { k: "my sentence" });
    await flushProgress();
    expect(putProgress).toHaveBeenCalledWith("own", { k: "my sentence" });
  });

  it("saves with the version it started from", async () => {
    startProgressSync({ known: { x: 1 } }, { known: 7 }, "tok");
    const { save } = setupDevice({ known: { x: 1 } });
    save("known", { x: 1, a: 1 });
    save("plan", {});
    await flushProgress();
    expect(putProgress).toHaveBeenCalledWith("known", { x: 1, a: 1 }, 7);
    // No document on the server yet.
    expect(putProgress).toHaveBeenCalledWith("plan", {}, null);
  });

  it("409: merges with the other device's save and sends the result", async () => {
    startProgressSync({ known: { x: 1 } }, { known: 7 }, "tok");
    const { save, local } = setupDevice({ known: { x: 1 } });
    putProgress
      .mockRejectedValueOnce(conflict)
      .mockResolvedValue({ data: { version: 9 } });
    getProgressDoc.mockResolvedValue({ data: { x: 1, b: 1 }, version: 8 });

    save("known", { x: 1, a: 1 });
    await flushProgress();

    expect(putProgress).toHaveBeenLastCalledWith(
      "known",
      { x: 1, a: 1, b: 1 },
      8,
    );
    // The store shows both devices' words.
    expect(local.known).toEqual({ x: 1, a: 1, b: 1 });
    expect(hasPendingProgress()).toBe(false);

    // The next save starts from the merged version.
    save("known", { x: 1, a: 1, b: 1, c: 1 });
    await flushProgress();
    expect(putProgress).toHaveBeenLastCalledWith(
      "known",
      { x: 1, a: 1, b: 1, c: 1 },
      9,
    );
  });

  it("401 keeps the whole batch (on the device too)", async () => {
    startProgressSync({}, {}, "tok");
    const { save } = setupDevice();
    putProgress.mockRejectedValue({ response: { status: 401 } });
    save("known", { a: 1 });
    save("srs", { a: { st: 1, due: 2 } });
    await flushProgress();

    expect(putProgress).toHaveBeenCalledTimes(1);
    expect(hasPendingProgress()).toBe(true);
    const outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY)!);
    expect(outbox.owner).toBe("tok");
    expect(Object.keys(outbox.items).sort()).toEqual(["known", "srs"]);
  });

  it("flushes never overlap", async () => {
    let release!: () => void;
    putProgress.mockImplementationOnce(
      () =>
        new Promise((r) => {
          release = () => r({ data: { version: 2 } });
        }),
    );
    queueProgress("known", { a: 1 });
    const first = flushProgress();
    await vi.advanceTimersByTimeAsync(0);
    queueProgress("known", { a: 1, b: 1 });
    const second = flushProgress();
    await vi.advanceTimersByTimeAsync(0);
    // The second waits for the first to finish.
    expect(putProgress).toHaveBeenCalledTimes(1);
    release();
    await first;
    await second;
    expect(putProgress).toHaveBeenCalledTimes(2);
  });

  it("outbox: saves of a closed tab come back on the next start", () => {
    startProgressSync({ known: { x: 1 } }, { known: 7 }, "tok");
    setupDevice({ known: { x: 1 } });
    queueProgress("known", { x: 1, a: 1 });
    writeOutbox();
    __resetProgressSync();
    setupDevice();

    // Nobody saved since: the device copy is used as is.
    const r1 = startProgressSync({ known: { x: 1 } }, { known: 7 }, "tok");
    expect(r1.map.known).toEqual({ x: 1, a: 1 });
    expect(r1.replay).toEqual(["known"]);

    // Another device saved since: both kept.
    const r2 = startProgressSync(
      { known: { x: 1, b: 1 } },
      { known: 8 },
      "tok",
    );
    expect(r2.map.known).toEqual({ x: 1, a: 1, b: 1 });

    // Another token on this browser never gets them.
    const r3 = startProgressSync({}, {}, "other");
    expect(r3.replay).toEqual([]);
  });

  it("outbox is cleared once everything is confirmed", async () => {
    startProgressSync({}, {}, "tok");
    setupDevice();
    queueProgress("known", { a: 1 });
    writeOutbox();
    expect(localStorage.getItem(OUTBOX_KEY)).not.toBeNull();
    await flushProgress();
    expect(localStorage.getItem(OUTBOX_KEY)).toBeNull();
  });

  it("closing the tab keeps the queue and sends small saves with keepalive", () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    startProgressSync({}, { known: 3 }, "tok");
    setupDevice();
    queueProgress("known", { a: 1 });
    flushProgressOnExit();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      data: { a: 1 },
      baseVersion: null,
    });
    expect(hasPendingProgress()).toBe(true);

    // Too big for keepalive: only the outbox.
    fetchMock.mockClear();
    queueProgress("known", { big: "x".repeat(70_000) });
    flushProgressOnExit();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(OUTBOX_KEY)).toContain("big");
    vi.unstubAllGlobals();
  });

  it("tab shown again: takes what another device saved", async () => {
    startProgressSync({ known: { x: 1 } }, { known: 7 }, "tok");
    const { applied } = setupDevice({ known: { x: 1 } });
    getProgress.mockResolvedValue({
      data: {
        docs: { known: { x: 1, b: 1 }, plan: {} },
        versions: { known: 8, plan: 2 },
      },
    });
    await refreshProgress();
    expect(applied).toEqual([
      ["known", { x: 1, b: 1 }],
      ["plan", {}],
    ]);
  });
});
