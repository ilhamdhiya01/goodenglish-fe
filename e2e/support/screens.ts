import { expect, type Page } from "@playwright/test";

import { globalSearchInput, openAiPanel, openApp, startQuickTest } from "./app";
import { adminSession, type MockOptions, progressWithDue } from "./mock-api";

// Every screen the redesign touches, in the state worth comparing. Used for
// the before/after screenshots and the axe baseline.
export interface Screen {
  name: string;
  path: string;
  mock?: MockOptions;
  /** Bring the page into the state to capture (after it has loaded). */
  setup?: (page: Page) => Promise<void>;
  /** Skip the shell wait (pages outside AppShell). */
  bare?: boolean;
  /** Capture only the viewport (overlays: panels, dropdowns, dialogs). */
  viewport?: boolean;
}

export const SCREENS: Screen[] = [
  { name: "dev-ui", path: "/dev/ui", bare: true },
  {
    // Status must survive without color: the gallery in full color blindness.
    name: "dev-ui-buta-warna",
    path: "/dev/ui",
    bare: true,
    setup: async (page) => {
      await page.getByRole("button", { name: /I didn't went there/ }).click();
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setEmulatedVisionDeficiency", {
        type: "achromatopsia",
      });
    },
  },
  { name: "access", path: "/access", mock: { session: null }, bare: true },
  { name: "plan", path: "/plan" },
  { name: "vocab", path: "/vocab" },
  {
    name: "vocab-mode-tes",
    path: "/vocab",
    setup: async (page) => {
      await page.getByRole("button", { name: /Mode tes/ }).click();
    },
  },
  {
    name: "vocab-penjelasan",
    path: "/vocab",
    setup: async (page) => {
      await page.getByRole("button", { name: "Penjelasan" }).first().click();
      await expect(page.getByText("Memuat penjelasan…")).toHaveCount(0, {
        timeout: 15_000,
      });
    },
  },
  {
    name: "tes-cepat",
    viewport: true,
    path: "/vocab",
    setup: async (page) => {
      await startQuickTest(page);
      await page.getByTestId("quiz-option").first().click();
    },
  },
  { name: "review", path: "/review", mock: { progress: progressWithDue() } },
  {
    name: "review-jawaban",
    path: "/review",
    mock: { progress: progressWithDue() },
    setup: async (page) => {
      await page.getByRole("button", { name: "Buka jawaban" }).click();
    },
  },
  { name: "review-kosong", path: "/review" },
  { name: "scenario", path: "/scenario" },
  { name: "errors", path: "/errors" },
  { name: "grammar-tense", path: "/grammar/tense" },
  {
    name: "grammar-latihan",
    path: "/grammar/thit",
    setup: async (page) => {
      await page.getByRole("button", { name: "Mulai 20 soal" }).first().click();
      await page.getByTestId("practice-option").first().click();
    },
  },
  { name: "grammar-been", path: "/grammar/been" },
  { name: "pronunciation", path: "/pronunciation" },
  { name: "cheatsheet", path: "/cheatsheet" },
  {
    name: "tanya-ai",
    viewport: true,
    path: "/vocab",
    setup: async (page) => {
      const panel = await openAiPanel(page);
      await panel
        .getByPlaceholder(/Tanya apa saja/)
        .fill("bedanya run out of sama run out apa?");
      await panel.getByRole("button", { name: "Kirim" }).click();
      await expect(
        panel.getByText("Run out of dipakai dengan benda."),
      ).toBeVisible();
    },
  },
  {
    name: "pencarian",
    viewport: true,
    path: "/vocab",
    setup: async (page) => {
      await (await globalSearchInput(page)).fill("run");
      await expect(page.getByTestId("search-result").first()).toBeVisible();
    },
  },
  {
    name: "admin-tokens",
    path: "/admin/tokens",
    mock: { session: adminSession },
    bare: true,
    setup: async (page) => {
      await expect(page.getByText("Budi").first()).toBeVisible();
    },
  },
];

export const openScreen = async (page: Page, s: Screen) => {
  if (s.bare) await page.goto(s.path);
  else await openApp(page, s.path);
  await s.setup?.(page);
  // Let fonts and late layout settle before measuring or capturing.
  await page.evaluate(() => document.fonts.ready);
};
