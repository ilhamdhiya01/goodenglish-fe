import path from "node:path";

import type { Locator, Page, TestInfo } from "@playwright/test";

import {
  openAiPanel,
  openApp,
  startQuickTest,
  toggleVocabMode,
} from "./support/app";
import { expect, test } from "./support/fixtures";
import { adminSession, DUE_KEYS, progressWithDue } from "./support/mock-api";

// The logo in its five places and Jalak in each state of the mascot table:
// the right mood shows, and nowhere else. BRAND_SCREENS=1 also saves a
// screenshot of each to docs/brand/screens/<project>/.

const shot = async (target: Page | Locator, info: TestInfo, name: string) => {
  if (!process.env.BRAND_SCREENS) return;
  await target.screenshot({
    path: path.join("docs/brand/screens", info.project.name, name + ".png"),
    animations: "disabled",
  });
};

const jalak = (scope: Page | Locator) => scope.locator("img[data-jalak]");

const expectMood = async (scope: Page | Locator, mood: string) => {
  await expect(jalak(scope)).toHaveCount(1);
  await expect(jalak(scope)).toHaveAttribute("data-jalak", mood);
  await expect(jalak(scope)).toHaveAttribute("alt", "");
  await expect(jalak(scope)).toHaveAttribute("aria-hidden", "true");
};

const isPhone = (page: Page) => page.viewportSize()!.width < 700;

/** A Wednesday, so the plan has its three weekday blocks. */
const WEDNESDAY = "2026-11-11T09:00:00";
const dayOf = (iso: string) => Math.floor(Date.parse(iso) / 86400000);

test.describe("logo", () => {
  test("sidebar, rel ikon, lembar Lainnya: nama disebut sekali", async ({
    page,
  }, info) => {
    await openApp(page, "/plan");
    if (isPhone(page)) {
      await page.getByRole("button", { name: "Lainnya" }).click();
      const sheet = page.getByRole("dialog", { name: "Lainnya" });
      await expect(
        sheet.getByText("GoodEnglish", { exact: true }),
      ).toBeVisible();
      await expect(
        sheet.locator('img[src="/brand/logo-mark.svg"]'),
      ).toHaveAttribute("alt", "");
      await shot(sheet, info, "logo-lainnya");
      return;
    }
    const home = page.getByRole("link", { name: "GoodEnglish", exact: true });
    await expect(home).toBeVisible();
    await expect(home).toHaveAttribute("href", "/plan");
    await shot(
      page.getByRole("complementary", { name: "Navigasi" }),
      info,
      "logo-sidebar",
    );

    // Tablet: the face alone, named by its alt text.
    await page.setViewportSize({ width: 820, height: 1000 });
    await expect(home).toBeVisible();
    await expect(home.locator("img")).toHaveAttribute("alt", "GoodEnglish");
    await shot(page, info, "logo-rel-820");
  });

  test.describe("tanpa sesi", () => {
    // The service worker (blocked elsewhere so API mocks always apply) is
    // what keeps Jalak available offline.
    test.use({ mock: { session: null }, serviceWorkers: "allow" });

    test("/access: logo bertumpuk; offline: Jalak sedih yang tetap tampil", async ({
      page,
      context,
    }, info) => {
      await page.goto("/access");
      await expect(
        page.getByText("GoodEnglish", { exact: true }),
      ).toBeVisible();
      await expect(jalak(page)).toHaveCount(0);
      await shot(page, info, "access");

      // Once the service worker has cached /brand, the sad face still loads
      // with the network gone.
      await page.evaluate(() => navigator.serviceWorker?.ready);
      await context.setOffline(true);
      await expectMood(page, "sedih");
      await expect
        .poll(() =>
          jalak(page).evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBeGreaterThan(0);
      await shot(page, info, "access-offline");
      await context.setOffline(false);
    });
  });

  test.describe("admin", () => {
    test.use({ mock: { session: adminSession } });

    test("header admin", async ({ page }, info) => {
      await page.goto("/admin/tokens");
      const header = page.locator("header").first();
      await expect(
        header.getByText("GoodEnglish", { exact: true }),
      ).toBeVisible();
      await expect(header.getByText("· ADMIN")).toBeVisible();
      await expect(jalak(page)).toHaveCount(0);
      await shot(header, info, "logo-admin");
    });
  });
});

test.describe("rencana", () => {
  const T = dayOf(WEDNESDAY);
  test.use({
    mock: {
      progress: {
        level: "pre",
        plan: {
          tally: { day: T, known: 10, ask: 20, pron: 1 },
          quiz: [{ d: T, score: 18, scope: "week", level: "pre", week: 1 }],
          week: { "pre|1": { rec: true, gpt: true } },
        },
        askprac: { r1: { done: {}, seen: 20, right: 20, wrong: 0 } },
      },
    },
  });

  test("semua blok selesai dan checkpoint lolos: bangga", async ({
    page,
  }, info) => {
    await page.clock.install({ time: new Date(WEDNESDAY) });
    await openApp(page, "/plan");
    const done = page.getByText(/^✓ Hari ini selesai\./).locator("..");
    const passed = page.getByText(/^✓ Lolos\./).locator("..");
    await expectMood(done, "bangga");
    await expectMood(passed, "bangga");
    await expect(jalak(page)).toHaveCount(2);
    await shot(page, info, "rencana-selesai");
  });
});

test("rencana belum selesai: tanpa Jalak", async ({ page }) => {
  await page.clock.install({ time: new Date(WEDNESDAY) });
  await openApp(page, "/plan");
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
  await expect(jalak(page)).toHaveCount(0);
});

test.describe("kosakata", () => {
  test("pencarian tanpa hasil: berpikir", async ({ page }, info) => {
    await openApp(page, "/vocab");
    await expect(page.locator("article").first()).toBeVisible();
    await expect(jalak(page)).toHaveCount(0);
    await page.getByLabel("Cari kata atau arti di minggu ini").fill("zzqx");
    await expect(page.getByText("Tidak ada kata yang cocok.")).toBeVisible();
    await expectMood(page.locator("main"), "berpikir");
    await shot(page, info, "kosakata-kosong");
  });

  test("prefers-reduced-motion: Jalak tidak bergerak", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openApp(page, "/vocab");
    await page.getByLabel("Cari kata atau arti di minggu ini").fill("zzqx");
    const duration = await jalak(page).evaluate(
      (img) => getComputedStyle(img).animationDuration,
    );
    expect(parseFloat(duration)).toBeLessThan(0.001);
  });

  test("gambar gagal dimuat: pesannya tetap lengkap", async ({ page }) => {
    await page.route("**/brand/**", (route) => route.abort());
    await openApp(page, "/vocab");
    await page.getByLabel("Cari kata atau arti di minggu ini").fill("zzqx");
    await expect(page.getByText("Tidak ada kata yang cocok.")).toBeVisible();
    // A broken image with alt="" draws no icon or alt text in its place.
    await expect(jalak(page)).toHaveAttribute("alt", "");
  });

  test("semua yang tampil sudah hafal: senang", async ({ page }, info) => {
    test.setTimeout(120_000);
    await openApp(page, "/vocab");
    await toggleVocabMode(page, /Sembunyikan yang hafal/);
    await page.getByRole("button", { name: "Jenis", exact: true }).click();
    await page
      .getByRole("dialog", { name: "Jenis kata" })
      .getByRole("button", { name: /^Phrasal verb/ })
      .click();
    const mark = page
      .locator("article")
      .getByRole("button", { name: "Tandai hafal", exact: true });
    for (let i = 0; i < 80 && (await mark.count()); i++)
      await mark.first().click();
    await expect(page.getByText(/^✓ Semua item di filter ini/)).toBeVisible();
    await expectMood(page.locator("main"), "senang");
    await shot(page, info, "kosakata-hafal");
  });

  test("tes cepat: hasil memakai senang atau biasa sesuai skor", async ({
    page,
  }, info) => {
    await openApp(page, "/vocab");
    await startQuickTest(page);
    const dialog = page.getByRole("dialog", { name: "Tes cepat" });
    for (let i = 0; i < 20; i++) {
      // Per-question feedback never shows Jalak.
      await expect(jalak(dialog)).toHaveCount(0);
      await dialog.getByTestId("quiz-option").last().click();
      await expect(jalak(dialog)).toHaveCount(0);
      await dialog
        .getByRole("button", { name: /Soal berikutnya|Lihat hasil/ })
        .click();
    }
    const score = Number(
      (await dialog.getByText(/^\d+ \/ 20$/).textContent())!.split(" ")[0],
    );
    await expectMood(dialog, score >= 16 ? "senang" : "biasa");
    await expect(jalak(dialog)).toHaveAttribute("width", "96");
    await shot(dialog, info, "tes-cepat-hasil");
  });
});

test("latihan 3 tahap: layar selesai sesuai akurasi", async ({
  page,
}, info) => {
  test.setTimeout(120_000);
  await openApp(page, "/grammar/thit");
  await page.getByRole("button", { name: /^1 · / }).click();
  if (await page.getByRole("button", { name: "Mulai 20 soal" }).count())
    await page.getByRole("button", { name: "Mulai 20 soal" }).click();
  for (let i = 0; i < 20; i++) {
    await expect(page.getByText(`Soal ${i + 1} / 20`)).toBeVisible();
    await page.getByTestId("practice-option").first().click();
    await expect(jalak(page)).toHaveCount(0);
    await page
      .getByRole("button", { name: /Soal berikutnya|Lihat hasil/ })
      .click();
  }
  const text = (await page
    .getByText(/^\d+ \/ 20/)
    .first()
    .textContent())!;
  const score = Number(text.split(" ")[0]);
  await expectMood(page, score / 20 >= 0.8 ? "senang" : "biasa");
  await shot(page, info, "latihan-selesai");
});

test.describe("ulang", () => {
  test.describe("ada yang jatuh tempo", () => {
    test.use({ mock: { progress: progressWithDue() } });

    test("sesi selesai: bangga", async ({ page }, info) => {
      await openApp(page, "/review");
      for (let i = 0; i < DUE_KEYS.length; i++) {
        await expect(jalak(page)).toHaveCount(0);
        await page.getByRole("button", { name: "Buka jawaban" }).click();
        await page.getByRole("button", { name: /Ingat/ }).click();
      }
      await expect(page.getByText(/^Tidak ada yang jatuh tempo/)).toBeVisible();
      await expectMood(page.locator("main"), "bangga");
      await shot(page, info, "ulang-selesai");
    });
  });

  test.describe("belum ada yang jatuh tempo", () => {
    const T = Math.floor(Date.now() / 86400000);
    test.use({
      mock: {
        progress: {
          level: "pre",
          known: Object.fromEntries(DUE_KEYS.map((k) => [k, 1])),
          srs: Object.fromEntries(
            DUE_KEYS.map((k) => [k, { st: 2, due: T + 3 }]),
          ),
        },
      },
    });

    test("tidak ada yang jatuh tempo: senang", async ({ page }, info) => {
      await openApp(page, "/review");
      await expect(page.getByText(/^Tidak ada yang jatuh tempo/)).toBeVisible();
      await expectMood(page.locator("main"), "senang");
      await shot(page, info, "ulang-kosong");
    });
  });
});

test.describe("tanya AI", () => {
  test("kosong: bicara; menunggu jawaban: berpikir", async ({ page }, info) => {
    await openApp(page, "/plan");
    const panel = await openAiPanel(page);
    await expectMood(panel, "bicara");
    await shot(panel, info, "ai-kosong");

    let release = () => {};
    const held = new Promise<void>((r) => (release = r));
    await page.route("**/api/v1/ai/chat", async (route) => {
      await held;
      await route.fallback();
    });
    await panel.getByRole("textbox", { name: "Pertanyaan" }).fill("halo");
    await panel.getByRole("button", { name: "Kirim" }).click();
    await expectMood(panel, "berpikir");
    await expect(jalak(panel)).toHaveAttribute("width", "48");
    await shot(panel, info, "ai-berpikir");
    release();
    await expect(panel.getByText("Run out of dipakai")).toBeVisible();
    await expect(jalak(panel)).toHaveCount(0);
  });

  test("jawaban gagal: sedih", async ({ page }, info) => {
    await openApp(page, "/plan");
    const panel = await openAiPanel(page);
    await page.route("**/api/v1/ai/chat", (route) =>
      route.fulfill({ status: 500, body: "{}" }),
    );
    await panel.getByRole("textbox", { name: "Pertanyaan" }).fill("halo");
    await panel.getByRole("button", { name: "Kirim" }).click();
    await expectMood(panel, "sedih");
    await shot(panel, info, "ai-gagal");
  });

  test.describe("kuota habis", () => {
    test.use({ mock: { aiUsage: { used: 20, limit: 20 } } });

    test("sedih di kartu kuota", async ({ page }, info) => {
      await openApp(page, "/plan");
      const panel = await openAiPanel(page);
      const card = panel.getByText("KUOTA HARI INI HABIS").locator("../..");
      await expectMood(card, "sedih");
      await shot(panel, info, "ai-kuota");
    });
  });
});
