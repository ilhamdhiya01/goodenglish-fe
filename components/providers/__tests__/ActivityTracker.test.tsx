import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/vocab" }));
const flushProgressOnExit = vi.fn();
const flushProgressOnHide = vi.fn();
vi.mock("@/lib/helpers/progress-sync.helper", () => ({
  queueProgress: vi.fn(),
  flushProgressOnExit,
  flushProgressOnHide,
}));

const { useActivityStore } = await import("@/stores/useActivityStore");
const { default: ActivityTracker } = await import("../ActivityTracker");

let visibility: DocumentVisibilityState = "visible";
const addTime = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  visibility = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(
    () => visibility,
  );
  addTime.mockReset();
  flushProgressOnExit.mockReset();
  flushProgressOnHide.mockReset();
  useActivityStore.setState({ addTime });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const seconds = () =>
  addTime.mock.calls.reduce((n, [, s]) => n + (s as number), 0);

describe("ActivityTracker", () => {
  it("counts a visible, active tab and saves once a minute", () => {
    render(<ActivityTracker />);
    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
      vi.advanceTimersByTime(30_000);
    });
    expect(addTime).not.toHaveBeenCalled();
    act(() => {
      window.dispatchEvent(new Event("keydown"));
      vi.advanceTimersByTime(30_000);
    });
    expect(addTime).toHaveBeenCalledWith("vocab", 60);
  });

  it("just opening the app counts nothing", () => {
    render(<ActivityTracker />);
    act(() => {
      vi.advanceTimersByTime(2 * 60_000);
    });
    expect(addTime).not.toHaveBeenCalled();
  });

  it("stops counting after a minute without interaction", () => {
    render(<ActivityTracker />);
    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
      vi.advanceTimersByTime(5 * 60_000);
    });
    // Ticks at 5..60 s count (12 × 5 s), later ones don't.
    expect(seconds()).toBe(60);
  });

  it("doesn't count a hidden tab, and saves when it's hidden", () => {
    render(<ActivityTracker />);
    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
      vi.advanceTimersByTime(10_000);
    });
    act(() => {
      visibility = "hidden";
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(addTime).toHaveBeenCalledWith("vocab", 10);
    expect(flushProgressOnHide).toHaveBeenCalled();
    addTime.mockReset();
    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
      vi.advanceTimersByTime(3 * 60_000);
    });
    expect(addTime).not.toHaveBeenCalled();
  });
});
