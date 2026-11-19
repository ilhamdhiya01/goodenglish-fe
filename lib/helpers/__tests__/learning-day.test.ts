import { afterEach, describe, expect, it, vi } from "vitest";

import { currentTimeZone, dayOf, setTimeZone, today } from "../storage.helper";

const utcDay = (iso: string) => Math.floor(Date.parse(iso) / 86_400_000);

afterEach(() => {
  vi.useRealTimers();
  setTimeZone("Asia/Jakarta");
});

describe("learning day (token time zone)", () => {
  it("a session at 06:00 WIB belongs to that day, not the UTC day before", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-20T23:00:00Z")); // 06:00 WIB on the 21st
    expect(today()).toBe(utcDay("2026-11-21T00:00:00Z"));
  });

  it("follows the token's zone and ignores unknown ones", () => {
    const ms = Date.parse("2026-11-20T16:30:00Z"); // 00:30 WITA on the 21st
    expect(dayOf(ms, "Asia/Makassar")).toBe(utcDay("2026-11-21T00:00:00Z"));
    setTimeZone("Asia/Makassar");
    expect(currentTimeZone()).toBe("Asia/Makassar");
    expect(dayOf(ms)).toBe(utcDay("2026-11-21T00:00:00Z"));
    setTimeZone("Not/AZone");
    expect(currentTimeZone()).toBe("Asia/Makassar");
    setTimeZone(undefined);
    expect(currentTimeZone()).toBe("Asia/Makassar");
  });

  it("defaults to Asia/Jakarta", () => {
    expect(currentTimeZone()).toBe("Asia/Jakarta");
  });
});
