import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { clickAccountAction, openApp } from "./support/app";
import { expect, test } from "./support/fixtures";
import { adminSession, fullSession, spoken } from "./support/mock-api";

// Tes penempatan + ujian akhir level (one test engine, full-screen over the
// app). Answers here are just "something": the scoring is unit-tested.

const runner = (page: Page) =>
  page.getByRole("dialog", { name: /Tes penempatan|Ujian akhir level/ });

/** Answer the current question with anything, then go on. */
const answerAny = async (page: Page) => {
  const d = runner(page);
  const option = d.getByTestId("test-option").first();
  const tile = d.getByTestId("test-tile").first();
  const box = d.getByRole("textbox").first();
  await expect(option.or(tile).or(box).first()).toBeVisible();
  if (await option.isVisible()) await option.click();
  else if (await tile.isVisible()) await tile.click();
  else await box.fill("something");
  await d.getByRole("button", { name: /^(Lanjut|Selesai)$/ }).click();
};

const axe = async (page: Page, where: string) => {
  await page.waitForTimeout(300);
  const { violations } = await new AxeBuilder({ page })
    .include("[role=dialog]")
    .analyze();
  expect(
    violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
    ),
    where,
  ).toEqual([]);
};

test.describe("pelajar baru", () => {
  test.use({ mock: { progress: {} } });
  test.describe.configure({ timeout: 120_000 });

  test("sambutan: bisa dilewati", async ({ page, api }) => {
    await openApp(page, "/plan");
    const hello = page.getByRole("dialog", { name: "Selamat datang" });
    await expect(hello).toBeVisible();
    await axe(page, "sambutan");
    await hello.getByRole("button", { name: "Pilih level sendiri" }).click();
    await expect(hello).toHaveCount(0);
    await expect
      .poll(
        () =>
          (api.lastPut("exam") as { placement?: { status: string } })?.placement
            ?.status,
      )
      .toBe("skipped");
  });

  test("tes penempatan sampai selesai, lalu Mulai di sini", async ({
    page,
    api,
  }) => {
    await openApp(page, "/plan");
    await page.getByRole("button", { name: "Mulai tes" }).click();
    // Counted per level (10 each), not over the whole test.
    await expect(page.getByText("Soal 1 dari 10")).toBeVisible();
    await axe(page, "soal");
    // Dictation questions play their sentence.
    let played = false;
    for (let i = 0; i < 45; i++) {
      if (await page.getByText("HASIL TES PENEMPATAN").isVisible()) break;
      const put = runner(page).getByRole("button", { name: "Putar" });
      if (!played && (await put.isVisible())) {
        await put.click();
        await expect.poll(() => spoken(page)).not.toEqual([]);
        played = true;
      }
      await answerAny(page);
    }
    await expect(page.getByText("HASIL TES PENEMPATAN")).toBeVisible();
    await expect(page.getByText(/Pemula · minggu 1/)).toBeVisible();
    expect(played).toBe(true);
    await axe(page, "hasil");
    await page.getByRole("button", { name: "Mulai di sini" }).click();
    await expect(runner(page)).toHaveCount(0);
    await expect
      .poll(() => api.lastPut("exam"))
      .toMatchObject({
        placement: {
          status: "done",
          recommended: { level: "beginner", week: 1 },
        },
        base: "beginner",
      });
    // No word is marked memorised by the test.
    expect(api.lastPut("known")).toBeUndefined();
  });
});

test.describe("pelajar lama", () => {
  test("tidak melihat sambutan; tes penempatan dari menu akun", async ({
    page,
  }) => {
    await openApp(page, "/plan");
    await expect(
      page.getByRole("dialog", { name: "Selamat datang" }),
    ).toHaveCount(0);
    await expect(
      page.getByText("UJIAN AKHIR LEVEL · PRE-INTERMEDIATE"),
    ).toBeVisible();
    await expect(page.getByText(/Terbuka saat 80% kata/)).toBeVisible();
  });
});

test.describe("keluar dari tes", () => {
  test("halaman bisa digulir lagi setelah keluar", async ({ page }) => {
    await openApp(page, "/plan");
    await clickAccountAction(page, "Tes penempatan");
    await expect(page.getByText(/Soal 1 dari/)).toBeVisible();
    await page.getByRole("button", { name: "Keluar dari tes" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Keluar" })
      .click();
    await expect(runner(page)).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe("");
  });
});

test.describe("ujian akhir level", () => {
  test.use({ mock: { progress: { level: "pre", weeks: { pre: "12" } } } });
  test.describe.configure({ timeout: 180_000 });

  test("terbuka di minggu terakhir; belum lulus → jeda 24 jam + Buku kesalahanku", async ({
    page,
    api,
  }) => {
    await openApp(page, "/plan");
    await page.getByRole("button", { name: "Mulai ujian" }).click();
    await expect(page.getByText(/Soal 1 dari 40/)).toBeVisible();
    for (let i = 0; i < 40; i++) await answerAny(page);
    await expect(page.getByText(/Belum lulus/).first()).toBeVisible();
    await expect(page.getByText("LATIHAN YANG DISARANKAN")).toBeVisible();
    await axe(page, "hasil ujian");
    await expect
      .poll(
        () =>
          (api.lastPut("exam") as { attempts?: unknown[] } | undefined)
            ?.attempts?.[0],
      )
      .toMatchObject({ level: "pre", passed: false });
    await expect
      .poll(
        () =>
          (
            (api.lastPut("mistakes") as { items?: { source: string }[] })
              ?.items ?? []
          ).filter((m) => m.source === "Ujian").length,
      )
      .toBeGreaterThan(10);
    await page.getByRole("button", { name: "Tutup" }).click();
    await expect(page.getByText(/Bisa diulang dalam 2\d jam/)).toBeVisible();
  });
});

test.describe("sudah lulus", () => {
  test.use({
    mock: {
      progress: {
        level: "pre",
        exam: {
          placement: null,
          base: "pre",
          attempts: [
            {
              id: "a1",
              level: "pre",
              date: "2026-11-17T03:00:00.000Z",
              sections: {
                vocab: { right: 13, total: 15 },
                grammar: { right: 12, total: 15 },
                listening: { right: 8, total: 10 },
              },
              pct: 83,
              passed: true,
            },
          ],
        },
      },
    },
  });

  test("sertifikat bisa diunduh sebagai gambar", async ({ page }) => {
    await openApp(page, "/plan");
    await expect(page.getByText(/Lulus .* skor 83%/)).toBeVisible();
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Unduh sertifikat" })
      .first()
      .click();
    expect((await download).suggestedFilename()).toBe(
      "sertifikat-goodenglish-pre-2026-11-17.png",
    );
  });
});

test.describe("wajib lulus ujian", () => {
  test.use({
    mock: {
      session: { ...fullSession, requireExam: true },
      progress: { level: "pre" },
    },
  });

  test("level di atas level awal terkunci di pemilih level", async ({
    page,
  }) => {
    await openApp(page, "/vocab");
    await page.getByRole("button", { name: /pilih level$/ }).click();
    await expect(
      page.getByText("🔒 Lulus ujian akhir level sebelumnya dulu").first(),
    ).toBeVisible();
    // Two levels above pre: intermediate and upper.
    await expect(
      page
        .getByText("🔒 Lulus ujian akhir level sebelumnya dulu")
        .filter({ visible: true }),
    ).toHaveCount(2);
  });
});

test.describe("admin", () => {
  test.use({ mock: { session: adminSession } });

  const rowAction = async (page: Page, owner: string, item: string) => {
    const row = page.locator("tr", { hasText: owner });
    await row.getByRole("button", { name: "Aksi token" }).click();
    await page.getByRole("menuitem", { name: item }).click();
  };

  test("form token + riwayat di Lihat progres", async ({ page }) => {
    await page.goto("/admin/tokens");
    await expect(page.getByText("Budi").first()).toBeVisible();
    await rowAction(page, "Budi", "Ubah");
    const dialog = page.getByRole("dialog");
    const box = dialog.getByRole("checkbox", {
      name: "Wajib lulus ujian untuk naik level",
    });
    await expect(box).not.toBeChecked();
    await box.check();
    const patch = page.waitForRequest(
      (r) => r.method() === "PATCH" && r.url().includes("/admin/tokens/t0"),
    );
    await dialog.getByRole("button", { name: "Simpan" }).click();
    expect(
      ((await patch).postDataJSON() as { requireExam: boolean }).requireExam,
    ).toBe(true);

    await rowAction(page, "Budi", "Lihat progres");
    await expect(
      page.getByText(/Tes penempatan .*: Intermediate minggu 5/),
    ).toBeVisible();
    await expect(page.getByText("UJIAN AKHIR LEVEL")).toBeVisible();
    await expect(page.getByText(/Lulus 82%/)).toBeVisible();
  });
});
