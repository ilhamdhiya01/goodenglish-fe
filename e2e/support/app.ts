import { expect, type Locator, type Page } from "@playwright/test";

// Everything that depends on WHERE the shell puts a control lives here, so a
// layout change (header icons → ⋯ menu, tabs → sidebar/bottom nav, ...) only
// touches these helpers, never the flows in e2e/*.spec.ts.

/** Open a route and wait until the shell has loaded session + progress. */
export const openApp = async (page: Page, path = "/plan") => {
  await page.goto(path);
  await expect(page.getByText("MEMUAT…")).toHaveCount(0, { timeout: 15_000 });
  await expect(page.locator("main, body").first()).toBeVisible();
};

export const globalSearchInput = (page: Page): Locator =>
  page.getByPlaceholder("Cari kata di semua level…");

export const searchResults = (page: Page): Locator =>
  page.getByTestId("search-result");

export const exportButton = (page: Page): Locator =>
  page.getByRole("button", { name: "Ekspor progres ke file" });

export const importInput = (page: Page): Locator =>
  page.locator('input[type="file"][accept*="json"]');

/** Start the 20-question quick test for the open week on /vocab. */
export const startQuickTest = async (page: Page) => {
  await page.getByRole("button", { name: /Tes minggu \d+ · 20 soal/ }).click();
};

export const quizOptions = (page: Page): Locator =>
  page.getByTestId("quiz-option");

export const openAiPanel = async (page: Page) => {
  await page.getByRole("button", { name: "Tanya AI" }).first().click();
  return page.getByRole("dialog", { name: "Tanya AI" });
};

export const navLink = (page: Page, name: string | RegExp): Locator =>
  page.getByRole("link", { name });
