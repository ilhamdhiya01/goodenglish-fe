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

/** Start the 20-question quick test from the week cover on /vocab. */
export const startQuickTest = async (page: Page) => {
  await page.getByRole("button", { name: /^Tes cepat/ }).click();
};

/** Turn a Kosakata mode on/off from the "Mode" sheet, then close it. */
export const toggleVocabMode = async (page: Page, name: RegExp) => {
  await page.getByRole("button", { name: /^Mode · \d/ }).click();
  await page
    .getByRole("dialog", { name: "Mode belajar" })
    .getByRole("button", { name })
    .click();
  await page.keyboard.press("Escape");
};

export const quizOptions = (page: Page): Locator =>
  page.getByTestId("quiz-option");

export const openAiPanel = async (page: Page) => {
  await page.getByRole("button", { name: "Tanya AI", exact: true }).click();
  return page.getByRole("dialog", { name: "Tanya AI" });
};

export const navLink = (page: Page, name: string | RegExp): Locator =>
  page.getByRole("link", { name });

/** Answers the app's own confirm dialog (not window.confirm) with its action button. */
export const acceptConfirm = async (page: Page, label?: string) => {
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await (
    label
      ? dialog.getByRole("button", { name: label })
      : dialog.getByRole("button").last()
  ).click();
  await expect(dialog).toBeHidden();
};

/** "Tandai hafal" first asks for the card's English word (KnownProof): type
 * it in and wait until the card is marked. Expressions default to the
 * microphone, so they're switched to typing. `card` must keep pointing at
 * the same card: not a locator filtered on its "Tandai hafal" button. */
export const markKnown = async (card: Locator) => {
  const word = (
    await card.locator("span.font-black").first().innerText()
  ).trim();
  await card.getByRole("button", { name: "Tandai hafal", exact: true }).click();
  const typeInstead = card.getByRole("button", { name: "Ketik saja" });
  if (await typeInstead.isVisible()) await typeInstead.click();
  const box = card.getByLabel(/^Ketik (kata|ungkapan) Inggris/);
  await box.fill(word);
  await box.press("Enter");
  await expect(box).toHaveCount(0, { timeout: 5_000 });
};
