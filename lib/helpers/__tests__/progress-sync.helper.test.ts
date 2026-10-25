import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const putProgress = vi.fn();
vi.mock("@/services/progress.service", () => ({ putProgress }));

const { flushProgress, hasPendingProgress, queueProgress } =
  await import("../progress-sync.helper");

describe("progress-sync.helper", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    putProgress.mockReset().mockResolvedValue({ data: null });
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
});
