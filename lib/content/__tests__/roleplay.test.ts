import { describe, expect, it } from "vitest";

import { VOCAB_SCEN, VOCAB_SCEN_KEY } from "@/lib/content";
import { SCENARIO_ROLEPLAY } from "@/lib/content/roleplay";
import type { Scenario } from "@/lib/types/scenario.types";

describe("Main peran data", () => {
  const scenarios = VOCAB_SCEN as Scenario[];

  it("exists for every scenario, with 2–4 steps in English and Indonesian", () => {
    expect(scenarios.length).toBeGreaterThan(0);
    for (const s of scenarios) {
      const rp = s.roleplay;
      expect(rp, s.id).toBeDefined();
      expect(rp!.roleAi.trim(), s.id).not.toBe("");
      expect(rp!.roleUser.trim(), s.id).not.toBe("");
      expect(rp!.mission.trim(), s.id).not.toBe("");
      expect(rp!.missionId.trim(), s.id).not.toBe("");
      expect(rp!.steps.length, s.id).toBeGreaterThanOrEqual(2);
      expect(rp!.steps.length, s.id).toBeLessThanOrEqual(4);
      for (const step of rp!.steps) {
        expect(step.en.trim()).not.toBe("");
        expect(step.id.trim()).not.toBe("");
      }
    }
  });

  it("has no entry for a scenario that doesn't exist", () => {
    const ids = new Set(scenarios.map((s) => s.id));
    expect(Object.keys(SCENARIO_ROLEPLAY).filter((id) => !ids.has(id))).toEqual(
      [],
    );
  });

  it("fits the backend limits (roles ≤ 120, mission ≤ 300, steps ≤ 160)", () => {
    for (const rp of Object.values(SCENARIO_ROLEPLAY)) {
      expect(rp.roleAi.length).toBeLessThanOrEqual(120);
      expect(rp.roleUser.length).toBeLessThanOrEqual(120);
      expect(rp.mission.length).toBeLessThanOrEqual(300);
      for (const s of rp.steps) expect(s.en.length).toBeLessThanOrEqual(160);
    }
  });

  it("has key phrases to show on the setup screen", () => {
    for (const s of scenarios) {
      expect(
        VOCAB_SCEN_KEY[s.id]?.phrases.length ?? 0,
        s.id,
      ).toBeGreaterThanOrEqual(3);
    }
  });
});
