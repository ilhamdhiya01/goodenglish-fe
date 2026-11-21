import type { Page } from "@playwright/test";

import { acceptConfirm, markKnown, openApp } from "./support/app";
import { expect, test } from "./support/fixtures";
import { ALL_MENUS, checkpointLulus, fullSession } from "./support/mock-api";

// Rencana harian: steps from the activity log (never from opening a page),
// duration, streak, the Saturday–Monday checkpoint, and old data.

const MONDAY = "2026-11-16T09:00:00";
const TUESDAY = "2026-11-17T09:00:00";
const WEDNESDAY = "2026-11-18T09:00:00";
const THURSDAY = "2026-11-19T09:00:00";
const SATURDAY = "2026-11-14T09:00:00";
const dayOf = (iso: string) => Math.floor(Date.parse(iso) / 86400000);

const langkah = (page: Page) =>
  page.getByRole("list", { name: "Langkah hari ini" }).locator(":scope > li");
const step = (page: Page, name: string) =>
  langkah(page).filter({ hasText: new RegExp(`^(\\d|✓)?${name}`) });

// Every menu Rencana can use.
const semua = {
  ...fullSession,
  menus: [
    ...ALL_MENUS,
    "roleplay" as const,
    "listening" as const,
    "reading" as const,
  ],
};

const at = async (page: Page, iso: string) => {
  await page.clock.install({ time: new Date(iso) });
  await openApp(page, "/plan");
};

// Week 2: the week's scenario (smalltalk) isn't the level's first one.
test.describe("tautan langkah dalam aplikasi", () => {
  test.use({
    mock: { session: semua, progress: { level: "pre", weeks: { pre: "2" } } },
  });

  test("Buka → membawa ?s= ke Skenario (rute statis)", async ({ page }) => {
    await at(page, WEDNESDAY);
    await step(page, "Masuk").getByRole("button", { name: "Buka →" }).click();
    await expect(page).toHaveURL(/\/scenario\?s=smalltalk/);
    // The scenario picker (the page's only select).
    await expect(page.locator("main select")).toHaveValue("smalltalk");
  });
});

test.describe("hari kerja", () => {
  test.use({
    mock: { session: semua, progress: { level: "pre", weeks: { pre: "1" } } },
  });

  test("membuka Rencana tidak mencentang apa pun; durasi 25 → 15 → 40", async ({
    page,
    api,
  }) => {
    await at(page, MONDAY);
    await expect(page.getByText("Hari ini 0/6")).toBeVisible();
    await expect(langkah(page)).toHaveCount(6);
    await expect(page.getByText("Selesai", { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Lanjut: Ulang →" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "15 menit" }).click();
    await expect(langkah(page)).toHaveCount(4);
    await page.getByRole("button", { name: "40 menit" }).click();
    await expect(langkah(page)).toHaveCount(8);
    await expect
      .poll(() => JSON.stringify(api.lastPut("plan") ?? {}))
      .toContain('"durasi":40');
    // Today's record is versioned: new days use the new rules.
    await expect
      .poll(() => JSON.stringify(api.lastPut("plan") ?? {}))
      .toContain('"v2":true');
  });

  test("Pakai: tiga kalimat dicek AI sekaligus", async ({ page, api }) => {
    await at(page, MONDAY);
    const pakai = page.locator("#pakai");
    await pakai.getByLabel("Kalimat 1").fill("I goed to the office.");
    await pakai.getByLabel("Kalimat 2").fill("She likes coffee.");
    await pakai.getByLabel("Kalimat 3").fill("We work from home on Friday.");
    await pakai.getByRole("button", { name: "Cek dengan AI" }).click();
    // One call for the three sentences.
    await expect.poll(() => api.checks.length).toBe(1);
    await expect(page.getByText("I went to the office.")).toBeVisible();
    await expect(step(page, "Pakai").getByText("Selesai")).toBeVisible();
    await expect
      .poll(() => api.laporan.filter((l) => l.jenis === "kalimat_dicek").length)
      .toBe(3);

    // The results come back from the log after a reload.
    await page.reload();
    await expect(
      page.locator("#pakai").getByText("I went to the office."),
    ).toBeVisible();
    await expect(page.locator("#pakai")).toContainText("3/3 KALIMAT");
  });

  test("Kata: hitungan naik saat menandai, turun saat dibatalkan", async ({
    page,
  }) => {
    await at(page, MONDAY);
    await expect(step(page, "Kata")).toContainText("0/6");
    await page.goto("/vocab");
    await markKnown(page.locator("article").first());
    await page
      .getByRole("link", { name: /^Rencana/ })
      .first()
      .click();
    await expect(step(page, "Kata")).toContainText("1/6");
    // In-app navigation (a reload would re-read the fixed mock progress).
    await page
      .getByRole("link", { name: /^Kosakata/ })
      .first()
      .click();
    await page
      .locator("article")
      .first()
      .getByRole("button", { name: "✓ Hafal", exact: true })
      .click();
    await acceptConfirm(page, "Batalkan hafal");
    await page
      .getByRole("link", { name: /^Rencana/ })
      .first()
      .click();
    await expect(step(page, "Kata")).toContainText("0/6");
  });

  test("Buka → dalam aplikasi membawa ?mode=pendek ke Main peran", async ({
    page,
  }) => {
    // Thursday's "Pakai" is a short roleplay. A client-side move, not a
    // fresh load: the page must still see the query.
    await at(page, THURSDAY);
    await step(page, "Pakai").getByRole("button", { name: "Buka →" }).click();
    await expect(page).toHaveURL(/\/scenario\/roleplay\/.+\?mode=pendek/);
    await expect(
      page.getByRole("button", { name: "Latihan pendek · 6 giliran" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("Mulai ulang minggu ini: tanpa menghapus streak dan riwayat", async ({
    page,
    api,
  }) => {
    await at(page, MONDAY);
    await page.getByRole("button", { name: "Menu rencana" }).click();
    await page
      .getByRole("menuitem", { name: "Mulai ulang minggu ini" })
      .click();
    await acceptConfirm(page, "Mulai ulang");
    await expect
      .poll(() => JSON.stringify(api.lastPut("plan") ?? {}))
      .toContain('"mulai":');
  });
});

test.describe("menu mati", () => {
  test.use({
    mock: {
      session: {
        ...semua,
        menus: semua.menus.filter((m) => m !== "ai" && m !== "roleplay"),
      },
      progress: { level: "pre", weeks: { pre: "1" } },
    },
  });

  test("langkah dari menu yang mati tidak tampil", async ({ page }) => {
    await at(page, MONDAY);
    await expect(langkah(page)).toHaveCount(5);
    await expect(step(page, "Pakai")).toHaveCount(0);
  });
});

test.describe("data lama", () => {
  const MON = dayOf(MONDAY);
  test.use({
    mock: {
      progress: {
        level: "pre",
        weeks: { pre: "1" },
        // A day of the old Rencana (three blocks).
        plan: { days: { [MON]: { b1: true, b2: true, b3: true } } },
      },
    },
  });

  test("hari lama tetap dihitung untuk streak", async ({ page }) => {
    await at(page, TUESDAY);
    await expect(page.getByText(/Streak\s*1\s*hari/)).toBeVisible();
  });
});

test.describe("checkpoint", () => {
  const SAT = dayOf(SATURDAY);

  test.describe("belum lulus", () => {
    test.use({
      mock: { session: semua, progress: { level: "pre", weeks: { pre: "1" } } },
    });

    test("akhir pekan: hanya Ulang; checkpoint menyebut yang kurang", async ({
      page,
    }) => {
      await at(page, SATURDAY);
      await expect(langkah(page)).toHaveCount(1);
      await expect(page.getByText(/CHECKPOINT MINGGU INI/)).toBeVisible();
      await expect(
        page.getByText(
          "Belum lulus: Kosakata, Grammar, Menyimak, Tugas nyata. Boleh diulang besok, atau tetap lanjut.",
        ),
      ).toBeVisible();
    });
  });

  test.describe("lulus", () => {
    test.use({
      mock: {
        session: semua,
        progress: { level: "pre", weeks: { pre: "1" } },
        laporan: checkpointLulus(SAT, false),
      },
    });

    test("ringkasan tugas nyata, lulus, pindah ke minggu berikutnya", async ({
      page,
      api,
    }) => {
      await at(page, SATURDAY);
      const box = page.getByLabel(/Ringkasan tugas nyata/);
      await box.fill(Array.from({ length: 30 }, () => "word").join(" "));
      await expect(
        page.getByRole("button", { name: "Simpan ringkasan" }),
      ).toBeDisabled();
      await box.fill(Array.from({ length: 70 }, () => "word").join(" "));
      await page.getByRole("button", { name: "Simpan ringkasan" }).click();
      await expect(
        page.getByText("Lulus. Kamu siap ke minggu berikutnya."),
      ).toBeVisible();
      await expect
        .poll(() => JSON.stringify(api.lastPut("plan") ?? {}))
        .toContain('"lulus":');
      await page
        .getByRole("button", { name: "Pindah ke minggu berikutnya" })
        .click();
      await expect.poll(() => api.lastPut("weeks")).toMatchObject({ pre: "2" });
    });
  });
});
