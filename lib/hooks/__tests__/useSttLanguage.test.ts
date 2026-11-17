import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { STT_LANGUAGE_KEY, useSttLanguage } from "../useSttLanguage";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("useSttLanguage", () => {
  it("defaults to EN and remembers the choice", () => {
    const { result } = renderHook(() => useSttLanguage());
    expect(result.current[0]).toBe("en");
    act(() => result.current[1]("id"));
    expect(result.current[0]).toBe("id");
    expect(localStorage.getItem(STT_LANGUAGE_KEY)).toBe("id");
    const again = renderHook(() => useSttLanguage());
    expect(again.result.current[0]).toBe("id");
  });

  it("ignores junk and survives a storage that throws", () => {
    localStorage.setItem(STT_LANGUAGE_KEY, "fr");
    expect(renderHook(() => useSttLanguage()).result.current[0]).toBe("en");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(() => useSttLanguage());
    expect(result.current[0]).toBe("en");
    act(() => result.current[1]("id"));
    expect(result.current[0]).toBe("id");
  });
});
