import { describe, expect, it } from "vitest";

import type { LearnerOverview } from "@/lib/types/admin.types";

import { idleDays, isInactive, sortLearners } from "../LearnerOverview";

const NOW = Date.parse("2026-11-18T12:00:00Z");
const row = (p: Partial<LearnerOverview>): LearnerOverview => ({
  id: p.label ?? "x",
  label: "x",
  status: "active",
  levels: ["pre"],
  menus: ["vocab"],
  level: null,
  lastActiveAt: null,
  streak: 0,
  minutes7d: 0,
  wordsThisWeek: 0,
  retention: null,
  reviews28d: 0,
  ...p,
});

describe("Ringkasan pelajar", () => {
  it("marks learners idle for 3+ days (or never active)", () => {
    expect(idleDays(row({ lastActiveAt: "2026-11-18T08:00:00Z" }), NOW)).toBe(
      0,
    );
    expect(isInactive(row({ lastActiveAt: "2026-11-16T13:00:00Z" }), NOW)).toBe(
      false,
    );
    expect(isInactive(row({ lastActiveAt: "2026-11-15T11:00:00Z" }), NOW)).toBe(
      true,
    );
    expect(isInactive(row({}), NOW)).toBe(true);
  });

  it("sorts any column both ways, empty values last", () => {
    const rows = [
      row({ label: "Budi", retention: 80, minutes7d: 5 }),
      row({ label: "Ani", retention: null, minutes7d: 30 }),
      row({ label: "Citra", retention: 60, minutes7d: 0 }),
    ];
    const names = (r: LearnerOverview[]) => r.map((x) => x.label);
    expect(names(sortLearners(rows, "label", "asc"))).toEqual([
      "Ani",
      "Budi",
      "Citra",
    ]);
    expect(names(sortLearners(rows, "minutes7d", "desc"))).toEqual([
      "Ani",
      "Budi",
      "Citra",
    ]);
    expect(names(sortLearners(rows, "retention", "asc"))).toEqual([
      "Citra",
      "Budi",
      "Ani",
    ]);
    expect(names(sortLearners(rows, "retention", "desc"))).toEqual([
      "Budi",
      "Citra",
      "Ani",
    ]);
  });
});
