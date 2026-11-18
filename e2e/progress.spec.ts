import { readFile } from "node:fs/promises";

import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { clickAccountAction, openApp } from "./support/app";
import { expect, test } from "./support/fixtures";
import {
  adminSession,
  progressDocs,
  progressSession,
  today,
} from "./support/mock-api";

// "Progres" (learner) and its admin views: the numbers come from the
// progress docs in mock-api (progressDocs), the maths is unit-tested.

const stat = (page: Page, label: string) =>
  page.getByText(label, { exact: true }).locator("xpath=..");

test.describe("pelajar", () => {
  test.use({ mock: { session: progressSession, progress: progressDocs() } });

  test("halaman Progres: angka sesuai data", async ({ page }) => {
    await openApp(page, "/progress");
    await expect(
      page.getByRole("heading", { name: "Progres", level: 2 }),
    ).toBeVisible();
    await expect(stat(page, "hari berturut-turut (streak)")).toContainText("2");
    // 600 + 300 + 120 s; the time this page itself adds isn't saved yet.
    await expect(stat(page, "menit belajar, 7 hari terakhir")).toContainText(
      "17",
    );
    // "be" in two levels counts once.
    await expect(stat(page, "kata hafal (semua level)")).toContainText("2");
    await expect(stat(page, "kartu jatuh tempo hari ini")).toContainText("1");
    await expect(page.getByText(/mulai dicatat sejak/)).toBeVisible();
    for (const h of [
      "Fokus minggu ini",
      "Kalender aktivitas",
      "Kata hafal per minggu",
      "Retensi Ulang",
      "Akurasi per topik grammar",
      "Keseimbangan skill",
      "Riwayat checkpoint dan ujian",
    ])
      await expect(page.getByRole("heading", { name: h })).toBeVisible();

    // Lowest accuracy first, with its practice link.
    const topics = page
      .getByRole("heading", { name: "Akurasi per topik grammar" })
      .locator("xpath=../..")
      .getByRole("listitem");
    await expect(topics.first()).toContainText("Memilih tense");
    await expect(topics.first()).toContainText("50% (12 soal)");
    await expect(
      page.getByRole("link", { name: "Latih Memilih tense" }),
    ).toHaveAttribute("href", "/grammar/tense");
    await expect(topics.nth(1)).toContainText("90%");

    const focus = page
      .getByRole("heading", { name: "Fokus minggu ini" })
      .locator("xpath=../..")
      .getByRole("listitem");
    await expect(focus).toHaveCount(3);
    await expect(focus.first().getByRole("link")).toHaveAttribute(
      "href",
      "/grammar/tense",
    );
    await expect(
      page.getByText("Minggu ini belum latihan menyimak."),
    ).toBeVisible();

    await expect(page.getByText(/Pre-intermediate minggu 1/)).toContainText(
      "Lolos",
    );
    await expect(page.getByText(/Lulus 82%/)).toBeVisible();
    await expect(page.getByText(/Intermediate minggu 5/).first()).toBeVisible();

    const { violations } = await new AxeBuilder({ page })
      .include("main")
      .analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  test("menu Progres ada di navigasi", async ({ page }) => {
    await openApp(page, "/plan");
    const nav = page.getByRole("navigation", { name: "Menu utama" });
    const direct = nav.getByRole("link", { name: /^Progres/ });
    if (await direct.isVisible()) await direct.click();
    else {
      await nav.getByRole("button", { name: "Lainnya" }).click();
      await page
        .getByRole("dialog", { name: "Lainnya" })
        .getByRole("link", { name: "Progres" })
        .click();
    }
    await expect(page).toHaveURL(/\/progress$/);
    await expect(
      page.getByRole("heading", { name: "Progres", level: 2 }),
    ).toBeVisible();
  });

  test("ekspor berisi log aktivitas (v9)", async ({ page }) => {
    await openApp(page, "/plan");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      clickAccountAction(page, "Ekspor progres"),
    ]);
    const data = JSON.parse(await readFile(await download.path(), "utf8"));
    expect(data.v).toBe(9);
    expect(data.activity.days[today()].m.vocab).toBeGreaterThanOrEqual(600);
    expect(data.activity.since).toBe(today() - 20);
  });
});

test.describe("tanpa data", () => {
  test.use({ mock: { session: progressSession, progress: { level: "pre" } } });

  test("bagian tanpa data disembunyikan", async ({ page }) => {
    await openApp(page, "/progress");
    await expect(stat(page, "kata hafal (semua level)")).toContainText("0");
    // (The calendar can show today: PlanAutoCheck ticks "Ulang" when nothing
    // is due.)
    for (const h of [
      "Kata hafal per minggu",
      "Retensi Ulang",
      "Akurasi per topik grammar",
      "Keseimbangan skill",
      "Riwayat checkpoint dan ujian",
    ])
      await expect(page.getByRole("heading", { name: h })).toHaveCount(0);
  });
});

test.describe("admin", () => {
  test.use({ mock: { session: adminSession } });

  test("Lihat progres: laporan yang sama, hanya baca", async ({ page }) => {
    await page.goto("/admin/tokens");
    const row = page.locator("tr", { hasText: "Budi" });
    await row.getByRole("button", { name: "Aksi token" }).click();
    await page.getByRole("menuitem", { name: "Lihat progres" }).click();
    const dialog = page.getByRole("dialog", { name: /Progres/ });
    await expect(
      dialog.getByRole("heading", { name: "Akurasi per topik grammar" }),
    ).toBeVisible();
    await expect(dialog.getByText("Memilih tense")).toBeVisible();
    await expect(dialog.getByRole("link", { name: /Latih/ })).toHaveCount(0);
    await expect(
      dialog.getByRole("heading", { name: "Fokus minggu ini" }),
    ).toHaveCount(0);
    await expect(dialog.getByText("Main peran per minggu")).toBeVisible();
  });

  test("Ringkasan pelajar: urut, tanda tidak aktif, buka progres", async ({
    page,
  }) => {
    await page.goto("/admin/learners");
    await expect(
      page.getByRole("heading", { name: "Ringkasan pelajar", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("3 pelajar · 1 tidak aktif 3+ hari"),
    ).toBeVisible();
    const names = () =>
      page.locator("tbody tr td:first-child button").allTextContents();
    // Longest idle first by default.
    await expect.poll(names).toEqual(["Sari", "Andi", "Budi"]);
    const sari = page.locator("tr", { hasText: "Sari" });
    await expect(sari).toHaveAttribute("data-inactive", "true");
    await expect(sari).toContainText("5 hari lalu");
    await expect(page.locator("tr", { hasText: "Budi" })).not.toHaveAttribute(
      "data-inactive",
      "true",
    );

    const phone = (page.viewportSize()?.width ?? 1280) < 700;
    if (phone) await page.getByLabel("Urutkan").selectOption("minutes7d:desc");
    else await page.getByRole("button", { name: "Menit · 7 hari" }).click();
    await expect.poll(names).toEqual(["Budi", "Andi", "Sari"]);

    await page.getByRole("button", { name: "Budi" }).click();
    await expect(
      page.getByRole("dialog", { name: "Progres Budi" }),
    ).toBeVisible();

    const { violations } = await new AxeBuilder({ page })
      .include("[role=dialog]")
      .analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
