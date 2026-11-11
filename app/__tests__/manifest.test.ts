import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import manifest from "../manifest";

describe("web app manifest", () => {
  const m = manifest();

  it("opens as a standalone app on the daily plan", () => {
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/plan");
    expect(m.scope).toBe("/");
  });

  it("has the icon sizes browsers require, including a maskable one", () => {
    const sizes = (m.icons ?? []).map((i) => i.sizes);
    expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(m.icons?.some((i) => i.purpose === "maskable")).toBe(true);
  });

  it("points at icon files that exist in public/", () => {
    for (const icon of m.icons ?? []) {
      expect(existsSync(join(process.cwd(), "public", icon.src))).toBe(true);
    }
  });
});
