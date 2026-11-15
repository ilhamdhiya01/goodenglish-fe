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

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) < 700;

/** The global search field; on a phone it first opens the search screen. */
export const globalSearchInput = async (page: Page): Promise<Locator> => {
  if (isPhone(page))
    await page.getByRole("button", { name: "Cari kata" }).click();
  return page.getByRole("combobox", { name: "Cari kata di semua level" });
};

export const searchResults = (page: Page): Locator =>
  page.getByTestId("search-result");

/** Account actions live in the ⋯ menu (computer) or "Lainnya" (phone). */
export const clickAccountAction = async (page: Page, name: string) => {
  const more = page.getByRole("button", { name: "Lainnya" });
  if (isPhone(page) && (await more.isVisible())) {
    await more.click();
    await page
      .getByRole("dialog", { name: "Lainnya" })
      .getByRole("button", { name })
      .click();
    return;
  }
  await page.getByRole("button", { name: "Menu akun" }).click();
  await page.getByRole("menuitem", { name }).click();
};

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
