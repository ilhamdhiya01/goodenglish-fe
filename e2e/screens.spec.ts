import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "./support/fixtures";
import { openScreen, SCREENS } from "./support/screens";

// Comparison screenshots, not pixel assertions: the redesign changes every
// pixel on purpose. Runs only on request (SCREENS_DIR=before pnpm e2e:screens)
// and writes to docs/redesign/screens/<SCREENS_DIR>/.
const dir = process.env.SCREENS_DIR;

test.describe("screens", () => {
  test.skip(!dir, "set SCREENS_DIR to capture comparison screenshots");

  for (const s of SCREENS) {
    test.describe(s.name, () => {
      if (s.mock) test.use({ mock: s.mock });

      test(`capture ${s.name}`, async ({ page }, info) => {
        await openScreen(page, s);
        const out = path.join("docs/redesign/screens", dir!, info.project.name);
        await mkdir(out, { recursive: true });
        // Long pages (a week can hold 350 word cards) are cut at 3000px:
        // enough to compare the layout without committing huge images.
        const height = await page.evaluate(() =>
          Math.min(document.documentElement.scrollHeight, 3000),
        );
        const width = page.viewportSize()!.width;
        await page.screenshot({
          path: path.join(out, `${s.name}.jpg`),
          ...(s.viewport
            ? {}
            : { fullPage: true, clip: { x: 0, y: 0, width, height } }),
          type: "jpeg",
          quality: 80,
          animations: "disabled",
        });
        expect(true).toBe(true);
      });
    });
  }
});
