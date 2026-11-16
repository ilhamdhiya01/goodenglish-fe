import { openApp } from "./support/app";
import { expect, test } from "./support/fixtures";
import { DUE_KEYS, progressWithDue } from "./support/mock-api";

// Rencana + Ulang after the redesign: keyboard shortcuts on Ulang, the
// automatic block check, the manual checkpoint boxes, reset, and the
// Saturday / weekend routine.

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

  test("blok Ulang tercentang otomatis setelah sesi selesai", async ({
    page,
  }) => {
    await openApp(page, "/plan");
    const ulang = page.locator("li", { hasText: "Ulang · 10 mnt" });
    await expect(ulang.getByText("Selesai")).toHaveCount(0);
    await page.goto("/review");
    for (let i = 0; i < DUE_KEYS.length; i++) {
      await page.getByRole("button", { name: "Buka jawaban" }).click();
      await page.getByRole("button", { name: /Ingat/ }).click();
    }
    await page
      .getByRole("link", { name: /^Rencana/ })
      .first()
      .click();
    await expect(ulang.getByText("Selesai")).toBeVisible();
  });
});

test("checkpoint: kotak centang manual tersimpan", async ({ page, api }) => {
  await openApp(page, "/plan");
  const box = page.getByRole("checkbox", { name: /Rekam 2 menit/ });
  await expect(box).toHaveAttribute("aria-checked", "false");
  await box.click();
  await expect(box).toHaveAttribute("aria-checked", "true");
  await expect
    .poll(() => JSON.stringify(api.lastPut("plan") ?? {}))
    .toContain('"rec":true');
});

test("reset rencana lewat menu ⋯ dengan konfirmasi", async ({ page }) => {
  await openApp(page, "/plan");
  await page.getByRole("checkbox", { name: /Rekam 2 menit/ }).click();
  await page.getByRole("button", { name: "Menu rencana" }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("menuitem", { name: "Reset rencana" }).click();
  await expect(
    page.getByRole("checkbox", { name: /Rekam 2 menit/ }),
  ).toHaveAttribute("aria-checked", "false");
});

test.describe("akhir pekan", () => {
  test("Sabtu: satu blok dan label checkpoint", async ({ page }) => {
    // Saturday 2026-11-14, 09:00 local time.
    await page.clock.install({ time: new Date("2026-11-14T09:00:00") });
    await openApp(page, "/plan");
    await expect(page.getByText(/Sabtu · checkpoint/)).toBeVisible();
    await expect(page.locator("ol > li")).toHaveCount(1);
    await expect(page.getByText(/Hari ini\s*\d+\/1/)).toBeVisible();
  });

  test("hari kerja: tiga blok", async ({ page }) => {
    // Wednesday 2026-11-11.
    await page.clock.install({ time: new Date("2026-11-11T09:00:00") });
    await openApp(page, "/plan");
    await expect(page.locator("ol > li")).toHaveCount(3);
  });
});
