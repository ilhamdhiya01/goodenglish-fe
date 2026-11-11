import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useInstallPrompt } from "../useInstallPrompt";

// What Chrome dispatches when the app becomes installable.
const installable = (outcome: "accepted" | "dismissed" = "accepted") => {
  const e = new Event("beforeinstallprompt", { cancelable: true });
  return Object.assign(e, {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome }),
  });
};

describe("useInstallPrompt", () => {
  it("offers nothing until the browser says the app is installable", () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it("shows the browser's prompt and hides the button afterwards", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const e = installable();
    act(() => {
      window.dispatchEvent(e);
    });
    expect(result.current.canInstall).toBe(true);
    // Kept for our button instead of the browser's own mini-infobar.
    expect(e.defaultPrevented).toBe(true);

    await act(() => result.current.install());
    expect(e.prompt).toHaveBeenCalled();
    expect(result.current.canInstall).toBe(false);
  });

  it("hides the button once installed some other way", () => {
    const { result } = renderHook(() => useInstallPrompt());
    act(() => {
      window.dispatchEvent(installable());
    });
    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });
    expect(result.current.canInstall).toBe(false);
  });
});
