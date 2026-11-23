import { describe, expect, it } from "vitest";

import { ROUTES } from "@/routes";

import { safeCallback } from "../AccessForm";

// After the token, only a page of this app: a link must not send the learner
// (and a fake "enter your token again" page) to another site.
describe("safeCallback", () => {
  it.each([
    ["/plan", "/plan"],
    ["/vocab?w=2#family", "/vocab?w=2#family"],
    [null, ROUTES.PLAN],
    ["//evil.com", ROUTES.PLAN],
    ["/\\evil.com", ROUTES.PLAN],
    ["https://evil.com/plan", ROUTES.PLAN],
    ["javascript:alert(1)", ROUTES.PLAN],
  ])("%s → %s", (raw, want) => {
    expect(safeCallback(raw)).toBe(want);
  });
});
