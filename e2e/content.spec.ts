import type { Page } from "@playwright/test";

import { openApp } from "./support/app";
import { expect, test } from "./support/fixtures";
import { spoken } from "./support/mock-api";

// Skenario, Kesalahan umum, Pelafalan, Cheat sheet after the redesign:
// everything that could be spoken still speaks, and the controls still work.

const isPhone = (page: Page) => page.viewportSize()!.width < 700;

test.describe("skenario", () => {
  test("pilih skenario lain, putar semua, ucapkan satu baris", async ({
    page,
  }) => {
    await openApp(page, "/scenario");
    const title = page.locator("span.text-xl").first();
    const before = await title.textContent();
    if (isPhone(page)) {
      const select = page.getByRole("combobox", { name: "Skenario" });
      const values = await select
        .locator("option")
        .evaluateAll((o) => o.map((x) => (x as HTMLOptionElement).value));
      await select.selectOption(values[1]);
    } else {
      await page
        .getByRole("navigation", { name: "Daftar skenario" })
        .getByRole("button")
        .nth(1)
        .click();
    }
    await expect(title).not.toHaveText(before!);

    await page.getByRole("button", { name: "Putar semua" }).click();
    await expect
      .poll(async () => (await spoken(page)).length)
      .toBeGreaterThan(3);

    const n = (await spoken(page)).length;
    await page
      .getByRole("list", { name: "Dialog" })
      .getByRole("button", { name: "Dengarkan" })
      .first()
      .click();
    await expect.poll(async () => (await spoken(page)).length).toBe(n + 1);
  });

  test("sembunyikan baris You lalu buka satu", async ({ page }) => {
    await openApp(page, "/scenario");
    await page.getByRole("button", { name: /Sembunyikan baris/ }).click();
    const reveal = page.getByRole("button", {
      name: "Coba ucapkan dulu, lalu klik",
    });
    const count = await reveal.count();
    expect(count).toBeGreaterThan(0);
    await reveal.first().click();
    await expect(reveal).toHaveCount(count - 1);
  });

  test("jawab sendiri: dengar lawan bicara berbunyi", async ({ page }) => {
    await openApp(page, "/scenario");
    await page.getByRole("button", { name: "Jawab sendiri" }).click();
    await page
      .getByRole("button", { name: /dengar lawan bicara/ })
      .first()
      .click();
    await expect
      .poll(async () => (await spoken(page)).length)
      .toBeGreaterThan(0);
  });

  test("frasa kunci dan variasi bisa diucapkan", async ({ page }) => {
    await openApp(page, "/scenario");
    // Key-phrase tiles are titled 'Dengarkan "…"'.
    await page.locator('button[title^="Dengarkan \\""]').first().click();
    await expect.poll(async () => (await spoken(page)).length).toBe(1);
    await page
      .getByRole("table")
      .getByRole("button", { name: "Dengarkan" })
      .first()
      .click();
    await expect.poll(async () => (await spoken(page)).length).toBe(2);
  });
});

test.describe("kesalahan umum", () => {
  test("baca: koreksi bisa diucapkan, filter level", async ({ page }) => {
    await openApp(page, "/errors");
    await expect(page.getByText(/^Salah:/).first()).toBeAttached();
    await page.getByRole("button", { name: "Dengarkan" }).first().click();
    await expect.poll(async () => (await spoken(page)).length).toBe(1);
    await page
      .getByRole("combobox", { name: "Level", exact: true })
      .selectOption("all");
    await expect(page.getByText(/^Salah:/).first()).toBeAttached();
  });

  test("kuis: pilih jawaban, lihat alasan, lanjut", async ({ page }) => {
    await openApp(page, "/errors");
    await page.getByRole("button", { name: /^Kuis · \d+ soal/ }).click();
    await page.getByTestId("error-option").first().click();
    await expect(page.getByRole("status")).toContainText(/Benar|Yang benar/);
    await expect(page.getByText(/benar \d+\/1 · soal 1\//)).toBeVisible();
    await page.getByRole("button", { name: /Soal berikutnya/ }).click();
    await expect(page.getByText(/soal 2\//)).toBeVisible();
  });
});

test.describe("pelafalan", () => {
  test("setiap bagian terbuka dan ubinnya berbunyi", async ({ page }) => {
    await openApp(page, "/pronunciation");
    for (const sec of [
      "Bunyi sulit",
      "Akhiran -ed",
      "Tekanan kata",
      "Intonasi",
      "Ucapan cepat",
      "Saat mentok",
    ]) {
      await page.getByRole("button", { name: sec, exact: true }).click();
      await expect(
        page.getByRole("button", { name: sec, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      const before = (await spoken(page)).length;
      // The first speakable control in the section: a tile, a speaker
      // button or a "dengar …" action.
      await page
        .locator(
          'main button:not([aria-pressed]):not([aria-label="Sembunyikan untuk hari ini"])',
        )
        .first()
        .click();
      await expect
        .poll(async () => (await spoken(page)).length, { message: sec })
        .toBeGreaterThan(before);
    }
  });

  test("tekanan kata: huruf kapital tetap ada", async ({ page }) => {
    await openApp(page, "/pronunciation");
    await page
      .getByRole("button", { name: "Tekanan kata", exact: true })
      .click();
    await expect(page.getByText(/[a-z][A-Z]{2,}/).first()).toBeVisible();
  });
});

test.describe("cheat sheet", () => {
  test("daftar isi melompat ke bagian, contoh bisa diucapkan", async ({
    page,
  }) => {
    await openApp(page, "/cheatsheet");
    if (isPhone(page)) {
      const select = page.getByRole("combobox", { name: "Isi" });
      const last = await select.locator("option").last().getAttribute("value");
      await select.selectOption(last!);
    } else {
      await page
        .getByRole("navigation", { name: "Isi cheat sheet" })
        .getByRole("button")
        .last()
        .click();
    }
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(500);
    await page.getByRole("button", { name: "Dengarkan" }).first().click();
    await expect
      .poll(async () => (await spoken(page)).length)
      .toBeGreaterThan(0);
  });
});
