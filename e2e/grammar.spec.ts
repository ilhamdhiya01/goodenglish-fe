import type { Page } from "@playwright/test";

import { openApp } from "./support/app";
import { expect, test } from "./support/fixtures";

// Panduan grammar after the redesign: section navigation, the bank of
// question sets, the Was/Have/Been timeline, and a full 20-question set in
// each of the three practice stages with the stats saved.

const isPhone = (page: Page) => page.viewportSize()!.width < 700;
const feedback = (page: Page) =>
  page.getByText(/^(Benar\.|Kurang tepat\.)/).first();

test("pindah bagian lewat daftar (atau Select di HP)", async ({ page }) => {
  await openApp(page, "/grammar/istilah");
  if (isPhone(page)) {
    await page.getByRole("combobox", { name: /Bagian/ }).selectOption("tense");
  } else {
    await page
      .getByRole("navigation", { name: "Bagian panduan grammar" })
      .getByRole("link", { name: "Memilih tense" })
      .click();
  }
  await expect(page).toHaveURL(/\/grammar\/tense$/);
  await expect(
    page.getByRole("heading", { name: "Memilih tense dalam 3 pertanyaan" }),
  ).toBeVisible();
});

test("garis waktu Was / Have / Been berlabel", async ({ page }) => {
  await openApp(page, "/grammar/been");
  for (const t of ["DULU", "TITIK LAMPAU", "SEKARANG", "have been", "had been"])
    await expect(page.getByText(t, { exact: true }).first()).toBeVisible();
});

test("bank soal: pilih set lain", async ({ page }) => {
  await openApp(page, "/grammar/thit");
  const sets = page.locator("button[aria-pressed]").filter({
    has: page.getByRole("progressbar"),
  });
  await expect(sets.nth(1)).toBeVisible();
  await sets.nth(1).click();
  await expect(sets.nth(1)).toHaveAttribute("aria-pressed", "true");
});

const answerOne = async (page: Page, stage: "mc" | "order" | "type") => {
  if (stage === "mc") {
    await page.getByTestId("practice-option").first().click();
  } else if (stage === "order") {
    const tokens = page.getByTestId("practice-token");
    await expect(tokens.first()).toBeVisible();
    const n = await tokens.count();
    for (let i = 0; i < n && !(await feedback(page).isVisible()); i++) {
      await tokens.nth(i).click();
    }
  } else {
    const box = page.getByRole("textbox", { name: "Jawabanmu" });
    await box.fill("is");
    await box.press("Enter");
  }
  await expect(feedback(page)).toBeVisible();
};

for (const [stage, pill] of [
  ["mc", /^1 · /],
  ["order", /^2 · /],
  ["type", /^3 · /],
] as const) {
  test(`latihan tahap ${stage}: satu set 20 soal, statistik tersimpan`, async ({
    page,
    api,
  }) => {
    test.setTimeout(120_000);
    await openApp(page, "/grammar/thit");
    await page.getByRole("button", { name: pill }).click();
    if (await page.getByRole("button", { name: "Mulai 20 soal" }).count())
      await page.getByRole("button", { name: "Mulai 20 soal" }).click();
    for (let i = 0; i < 20; i++) {
      await expect(page.getByText(`Soal ${i + 1} / 20`)).toBeVisible();
      await answerOne(page, stage);
      await page
        .getByRole("button", { name: /Soal berikutnya|Lihat hasil/ })
        .click();
    }
    await expect(page.getByText(/^\d+ \/ 20/).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate 20 soal baru" }),
    ).toBeVisible();
    await expect
      .poll(() => {
        const st = (api.lastPut("askprac") ?? {}) as Record<
          string,
          { seen?: number }
        >;
        return Math.max(0, ...Object.values(st).map((x) => x.seen || 0));
      })
      .toBe(20);
  });
}
