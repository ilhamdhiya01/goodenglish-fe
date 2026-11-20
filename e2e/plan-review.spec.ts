import { openApp } from "./support/app";
import { expect, test } from "./support/fixtures";
import { DUE_KEYS, progressWithDue } from "./support/mock-api";

// Ulang's keyboard shortcuts, and Rencana's Ulang step ticking from what
// Ulang reports (the rest of Rencana: rencana.spec.ts).

test.describe("ulang: pintasan keyboard", () => {
  test.use({ mock: { progress: progressWithDue() } });

  test("Spasi membuka, 3 = Ingat, sampai antrean habis", async ({
    page,
    api,
  }) => {
    await openApp(page, "/review");
    for (let i = 0; i < DUE_KEYS.length; i++) {
      await expect(
        page.getByRole("button", { name: "Buka jawaban" }),
      ).toBeVisible();
      await page.locator("body").press("Space");
      await expect(page.getByRole("button", { name: /Ingat/ })).toBeVisible();
      await page.locator("body").press("3");
    }
    await expect(
      page.getByText(/Tidak ada yang jatuh tempo hari ini/),
    ).toBeVisible();
    await expect
      .poll(() => {
        const srs = (api.lastPut("srs") ?? {}) as Record<
          string,
          { st: number }
        >;
        return DUE_KEYS.every((k) => srs[k]?.st === 2);
      })
      .toBe(true);
  });

  test("1 = Lupa mengembalikan ke tahap 1", async ({ page, api }) => {
    await openApp(page, "/review");
    await page.locator("body").press("Space");
    await page.locator("body").press("1");
    await expect
      .poll(
        () =>
          (api.lastPut("srs") as Record<string, { st: number }>)?.[DUE_KEYS[0]]
            ?.st,
      )
      .toBe(0);
  });

  test("angka belum bekerja sebelum jawaban dibuka", async ({ page, api }) => {
    await openApp(page, "/review");
    await page.locator("body").press("3");
    await page.waitForTimeout(1000);
    expect(api.lastPut("srs")).toBeUndefined();
    await expect(
      page.getByRole("button", { name: "Buka jawaban" }),
    ).toBeVisible();
  });

  test("pintasan diam saat panel Tanya AI terbuka", async ({ page, api }) => {
    await openApp(page, "/review");
    await page.getByRole("button", { name: "Tanya AI" }).click();
    await expect(page.getByRole("dialog", { name: "Tanya AI" })).toBeVisible();
    await page.locator("body").press("Space");
    await page.locator("body").press("3");
    await page.waitForTimeout(1000);
    expect(api.lastPut("srs")).toBeUndefined();
  });

  test("langkah Ulang selesai setelah kartu jatuh tempo habis", async ({
    page,
    api,
  }) => {
    await openApp(page, "/plan");
    const ulang = page
      .getByRole("list", { name: "Langkah hari ini" })
      .locator("li", { hasText: "Ulang" });
    await expect(ulang.getByText("Selesai")).toHaveCount(0);
    await page.goto("/review");
    for (let i = 0; i < DUE_KEYS.length; i++) {
      await page.getByRole("button", { name: "Buka jawaban" }).click();
      await page.getByRole("button", { name: /Ingat/ }).click();
    }
    // Reported to the activity log: each card, then the empty queue.
    await expect
      .poll(() => api.laporan.map((l) => l.jenis))
      .toContain("ulang_habis");
    await page
      .getByRole("link", { name: /^Rencana/ })
      .first()
      .click();
    await expect(ulang.getByText("Selesai")).toBeVisible();
  });
});
