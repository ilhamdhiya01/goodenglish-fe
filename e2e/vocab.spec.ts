import type { Page } from "@playwright/test";

import { openApp, startQuickTest, toggleVocabMode } from "./support/app";
import { expect, test } from "./support/fixtures";

// Kosakata after the redesign: every mode and filter still works, and the
// quick test runs in a dialog.

const isPhone = (page: Page) => page.viewportSize()!.width < 700;

test("arah Indo → Inggris: arti jadi judul kartu", async ({ page }) => {
  await openApp(page, "/vocab");
  await toggleVocabMode(page, /Inggris → Indo/);
  const card = page.locator("article").first();
  await expect(card.getByText("adalah / berada")).toHaveClass(/text-xl/);
  await expect(page.getByText(/Indo → Inggris/).first()).toBeVisible();
});

test("sembunyikan yang hafal + filter jenis", async ({ page, api }) => {
  await openApp(page, "/vocab");
  await page
    .locator("article")
    .first()
    .getByRole("button", { name: "Tandai hafal", exact: true })
    .click();
  await expect.poll(() => api.lastPut("known")).toBeTruthy();
  await toggleVocabMode(page, /Sembunyikan yang hafal/);
  await expect(page.getByText("adalah / berada")).toHaveCount(0);

  await page.getByRole("button", { name: "Jenis", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Jenis kata" })
    .getByRole("button", { name: /^Phrasal verb/ })
    .click();
  await expect(
    page.locator("article").first().getByText("Phrasal verb"),
  ).toBeVisible();
});

test("cari di minggu ini menampilkan jumlah hasil", async ({ page }) => {
  await openApp(page, "/vocab");
  await page
    .getByRole("textbox", { name: "Cari kata atau arti di minggu ini" })
    .fill("pergi");
  await expect(
    page.getByText(/\d+ hasil untuk "pergi" di minggu ini/),
  ).toBeVisible();
  await expect(page.locator("article").first()).toContainText("go");
});

test("kalimatku tersimpan ke progres", async ({ page, api }) => {
  await openApp(page, "/vocab");
  const card = page.locator("article").first();
  await card.getByRole("button", { name: "+ kalimatku" }).click();
  const input = card.getByRole("textbox", { name: "Kalimatku" });
  await input.fill("I am happy today.");
  await input.press("Enter");
  await expect(
    card.getByText("✓ tersimpan · dipakai saat ulangan"),
  ).toBeVisible();
  await expect
    .poll(() => Object.values((api.lastPut("own") as object) ?? {}))
    .toContain("I am happy today.");
});

test("daftar minggu: pilih minggu 2", async ({ page }) => {
  await openApp(page, "/vocab");
  if (isPhone(page)) {
    await page.getByRole("button", { name: "Minggu", exact: true }).click();
  }
  const weeks = page.getByRole("navigation", { name: "Daftar minggu" });
  await weeks.getByRole("button", { name: /^2 · / }).click();
  await expect(page.getByRole("heading", { level: 2 }).first()).toHaveText(
    /Rumah, makanan & belanja/,
  );
});

test("tes cepat di dialog: Esc menutup, 20 soal sampai hasil", async ({
  page,
  api,
}) => {
  await openApp(page, "/vocab");
  await startQuickTest(page);
  const dialog = page.getByRole("dialog", { name: "Tes cepat" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  await startQuickTest(page);
  for (let i = 0; i < 20; i++) {
    // Always the last option: some answers will be wrong.
    await dialog.getByTestId("quiz-option").last().click();
    await dialog
      .getByRole("button", { name: /Soal berikutnya|Lihat hasil/ })
      .click();
  }
  await expect(dialog.getByText(/^\d+ \/ 20$/)).toBeVisible();
  const wrong = dialog.getByText("Yang salah");
  if (await wrong.count())
    await expect(dialog.getByText(/^Salah:/).first()).toBeAttached();
  // The score is logged to the plan.
  await expect.poll(() => api.lastPut("plan")).toBeTruthy();
});
