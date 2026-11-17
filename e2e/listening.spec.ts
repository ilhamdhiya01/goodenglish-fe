import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { acceptConfirm, openApp } from "./support/app";
import { expect, test } from "./support/fixtures";
import { adminSession, listeningSession, spoken } from "./support/mock-api";

// "Menyimak": dictation, listen & answer, minimal pairs, and the admin bank.
// Headless runs make no sound; window.__spoken tells the test what was played.

const lastSpoken = async (page: Page) => {
  const s = await spoken(page);
  return s[s.length - 1];
};

test.describe("pelajar", () => {
  test.use({ mock: { session: listeningSession, progress: { level: "pre" } } });
  // Whole sets (10–20 questions) take a while when tests run in parallel.
  test.describe.configure({ timeout: 90_000 });

  test("/listening membuka Dikte; tahap 2 terkunci", async ({ page }) => {
    await openApp(page, "/listening");
    await expect(page).toHaveURL(/\/listening\/dikte$/);
    // AppShell also has a screen-reader <h1> with the menu name.
    await expect(
      page.getByRole("heading", { name: "Menyimak", level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Dikte" }).first(),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("radio", { name: /^Tahap 2/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test("Dikte: satu set penuh, tanda per kata, Coba lagi, tahap 2 terbuka", async ({
    page,
    api,
  }) => {
    await openApp(page, "/listening/dikte");
    await page.getByRole("button", { name: "Mulai tahap 1" }).click();
    const box = page.getByRole("textbox", { name: "Tulis yang kamu dengar" });

    for (let i = 0; i < 10; i++) {
      await expect(page.getByText(`KALIMAT ${i + 1}/10`)).toBeVisible();
      await page.getByRole("button", { name: "Putar", exact: true }).click();
      const text = await lastSpoken(page);
      const words = text.split(" ");
      if (i < 2) {
        // A word left out: marked as missing, not 100%.
        await box.fill(words.slice(0, -1).join(" "));
        await page.getByRole("button", { name: "Periksa" }).click();
        await expect(page.getByText(/Terlewat:/).first()).toBeAttached();
        await expect(
          page.getByRole("button", { name: "Coba lagi" }),
        ).toBeVisible();
        if (i === 0) {
          await page.getByRole("button", { name: "Coba lagi" }).click();
          await box.fill(text.toUpperCase());
          await page.getByRole("button", { name: "Periksa" }).click();
          await expect(page.getByText("100%", { exact: true })).toBeVisible();
          await expect(
            page.getByRole("button", { name: "Coba lagi" }),
          ).toHaveCount(0);
        }
      } else {
        await box.fill(text);
        await page.getByRole("button", { name: "Periksa" }).click();
      }
      await page
        .getByRole("button", { name: i < 9 ? "Lanjut" : "Lihat hasil" })
        .click();
    }

    await expect(page.getByText(/HASIL SET · TAHAP 1/)).toBeVisible();
    await expect(page.getByText(/Tahap 2 sekarang terbuka/)).toBeVisible();
    await expect(page.getByText(/9 dari 10 kalimat sempurna/)).toBeVisible();

    await expect
      .poll(
        () =>
          (api.lastPut("listening") as { stages?: object } | undefined)?.stages,
      )
      .toEqual({ dikte: 2 });
    const doc = api.lastPut("listening") as {
      results: { tab: string; stage: number; questions: number }[];
    };
    expect(doc.results[0]).toMatchObject({
      tab: "dikte",
      stage: 1,
      questions: 10,
    });
    // The sentence left wrong went to Buku kesalahanku.
    const mistakes = api.lastPut("mistakes") as {
      source: string;
      category: string;
    }[];
    expect(mistakes).toHaveLength(1);
    expect(mistakes[0]).toMatchObject({
      source: "Menyimak",
      category: "Menyimak",
    });
  });

  test("Dengar & jawab: transkrip baru muncul setelah menjawab", async ({
    page,
  }) => {
    await openApp(page, "/listening/dengar");
    await page.getByRole("button", { name: "Mulai tahap 1" }).click();
    for (let k = 0; k < 2; k++) {
      await expect(
        page.getByText(/Hello, the train leaves at ten/),
      ).toHaveCount(0);
      await page.getByRole("button", { name: "Putar", exact: true }).click();
      expect(await spoken(page)).toEqual(
        expect.arrayContaining([expect.stringMatching(/^Hello, the train/)]),
      );
      await expect(
        page.getByRole("button", { name: "Periksa jawaban" }),
      ).toBeDisabled();
      await page.getByRole("button", { name: "At ten" }).click();
      await page.getByRole("button", { name: "Two" }).click();
      await page.getByRole("button", { name: "B", exact: true }).click();
      await page.getByRole("button", { name: "Periksa jawaban" }).click();
      await expect(page.getByText(/TRANSKRIP/)).toBeVisible();
      await expect(
        page.getByText(/Hello, the train leaves at ten/),
      ).toBeVisible();
      await expect(
        page.getByText('Disebut "at ten".', { exact: false }),
      ).toBeVisible();
      await page
        .getByRole("button", {
          name: k === 0 ? "Soal berikutnya" : "Lihat hasil",
        })
        .click();
    }
    await expect(page.getByText("Akurasi 100%")).toBeVisible();
    await expect(page.getByText("6 dari 6 soal benar")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Lanjut ke tahap 2" }),
    ).toBeVisible();
  });

  test("Bunyi mirip: hasil per bunyi dan link ke Pelafalan", async ({
    page,
  }) => {
    await openApp(page, "/listening/bunyi");
    await page.getByRole("button", { name: "Mulai tahap 1" }).click();
    for (let i = 0; i < 20; i++) {
      await expect(page.getByText(`SOAL ${i + 1}/20`)).toBeVisible();
      if (i === 0)
        await page.getByRole("button", { name: "Putar", exact: true }).click();
      const said = /^Say (\w+) again\.$/.exec(await lastSpoken(page))![1];
      const options = page.locator("button[class*='rounded-lg']", {
        has: page.locator("span.text-lg"),
      });
      const texts = await options.locator("span.text-lg").allTextContents();
      // The first 8 wrong on purpose, so some sounds need work.
      const choice = i < 8 ? texts.find((t) => t !== said)! : said;
      await page.getByRole("button", { name: choice, exact: true }).click();
      await page
        .getByRole("button", { name: i < 19 ? "Lanjut" : "Lihat hasil" })
        .click();
    }
    await expect(page.getByText("PER BUNYI")).toBeVisible();
    await expect(page.getByText("12 dari 20 benar")).toBeVisible();
    await page
      .getByRole("link", { name: /Perlu latihan/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/pronunciation\?bagian=sounds/);
    await expect(
      page.getByText("Pasangan kata (beda arti)").first(),
    ).toBeVisible();
  });
});

test.describe("aksesibilitas", () => {
  test.use({ mock: { session: listeningSession, progress: { level: "pre" } } });

  test("axe: ketiga tab dan layar soal", async ({ page }) => {
    test.setTimeout(90_000);
    const check = async (where: string) => {
      const { violations } = await new AxeBuilder({ page })
        .include("main")
        .analyze();
      expect(
        violations.map((v) => `${v.id}: ${v.help}`),
        where,
      ).toEqual([]);
    };
    for (const tab of ["dikte", "dengar", "bunyi"]) {
      await openApp(page, `/listening/${tab}`);
      await check(`${tab} awal`);
      await page.getByRole("button", { name: "Mulai tahap 1" }).click();
      await page.getByRole("button", { name: "Putar", exact: true }).click();
      await check(`${tab} soal`);
    }
  });
});

test.describe("belum ada soal Dengar & jawab", () => {
  test.use({
    mock: {
      session: listeningSession,
      progress: { level: "pre" },
      listeningItems: [],
    },
  });

  test("menampilkan pesan, bukan error", async ({ page }) => {
    await openApp(page, "/listening/dengar");
    await expect(page.getByText(/Belum ada soal Dengar & jawab/)).toBeVisible();
  });
});

test.describe("admin", () => {
  test.use({ mock: { session: adminSession } });

  test("generate, ubah, terbitkan, hapus", async ({ page, api }) => {
    await page.goto("/admin/listening");
    await expect(page.getByText("Station draft")).toBeVisible();

    await page.getByRole("button", { name: "Generate 1 draf" }).click();
    await expect(page.getByText("Generated draft")).toBeVisible();
    const gen = api.listening.find(
      (c) => c.call === "POST /admin/listening/generate",
    );
    expect(gen!.body).toMatchObject({
      level: "pre",
      week: 1,
      count: 1,
      type: "dialog",
    });
    expect((gen!.body as { words: string[] }).words.length).toBeGreaterThan(5);

    const station = page.locator("li", { hasText: "Station draft" });
    await station.getByRole("button", { name: "Terbitkan" }).click();
    await expect
      .poll(() => api.listening.map((c) => c.call))
      .toContain("POST /admin/listening/bank1/publish");
    await expect(station.getByText("Terbit", { exact: true })).toBeVisible();

    await station.getByRole("button", { name: "Ubah" }).click();
    await station.getByLabel("Judul").fill("Edited title");
    await station.getByRole("button", { name: "Simpan" }).click();
    await expect
      .poll(
        () =>
          api.listening.find((c) => c.call === "PATCH /admin/listening/bank1")
            ?.body,
      )
      .toMatchObject({ title: "Edited title" });

    const edited = page.locator("li", { hasText: "Edited title" });
    await edited.getByRole("button", { name: "Hapus" }).click();
    await acceptConfirm(page, "Hapus");
    await expect
      .poll(() => api.listening.map((c) => c.call))
      .toContain("DELETE /admin/listening/bank1");
    await expect(page.getByText("Edited title")).toHaveCount(0);
  });
});
