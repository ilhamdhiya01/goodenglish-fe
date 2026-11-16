import { readFileSync, writeFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";

import { expect, test } from "./support/fixtures";
import { openScreen, SCREENS } from "./support/screens";

// axe on every screen, compared against e2e/a11y-baseline.json: violations
// that already existed before the redesign are recorded there, and a test
// fails only when a rule is newly violated or hits more elements than before.
// Refresh after fixing issues: UPDATE_A11Y_BASELINE=1 pnpm e2e e2e/a11y.spec.ts
// (run with --workers=1 so every result lands in the file).

const FILE = "e2e/a11y-baseline.json";
type Baseline = Record<string, Record<string, number>>;

const readBaseline = (): Baseline => {
  try {
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
};

const update = !!process.env.UPDATE_A11Y_BASELINE;

for (const s of SCREENS) {
  test.describe(s.name, () => {
    if (s.mock) test.use({ mock: s.mock });

    test(`axe ${s.name}`, async ({ page }, info) => {
      // A week of word cards is a big DOM; axe needs ~20s on it.
      test.setTimeout(90_000);
      await openScreen(page, s);
      const { violations } = await new AxeBuilder({ page }).analyze();
      const found = Object.fromEntries(
        violations.map((v) => [v.id, v.nodes.length]),
      );
      const key = `${info.project.name}/${s.name}`;

      if (update) {
        const all = readBaseline();
        all[key] = found;
        const sorted = Object.fromEntries(
          Object.entries(all).sort(([a], [b]) => a.localeCompare(b)),
        );
        writeFileSync(FILE, JSON.stringify(sorted, null, 2) + "\n");
        return;
      }

      const known = readBaseline()[key] ?? {};
      const worse = violations
        .filter((v) => v.nodes.length > (known[v.id] ?? 0))
        .map(
          (v) =>
            `${v.id} (${known[v.id] ?? 0} → ${v.nodes.length}): ${v.help}\n  ` +
            v.nodes
              .slice(0, 12)
              .map((n) => n.target.join(" "))
              .join("\n  "),
        );
      expect(worse, `new axe violations on ${key}`).toEqual([]);
    });
  });
}
