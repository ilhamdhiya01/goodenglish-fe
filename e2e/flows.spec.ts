import { readFile } from "node:fs/promises";

import {
  clickAccountAction,
  globalSearchInput,
  importInput,
  navLink,
  openAiPanel,
  openApp,
  quizOptions,
  searchResults,
  startQuickTest,
  toggleVocabMode,
} from "./support/app";
import { expect, test } from "./support/fixtures";
import { DUE_KEYS, limitedSession, progressWithDue } from "./support/mock-api";

// Core learner flows. Selectors use roles, labels and visible text (plus a few
// data-testid hooks) so they survive the visual redesign.

test.describe("akses", () => {
  test.use({ mock: { session: null } });

  test("token salah menampilkan pesan, token benar masuk ke Rencana", async ({
    page,
  }) => {
    await page.goto("/plan");
    await expect(page).toHaveURL(/\/access/);
    const input = page.getByPlaceholder("ge_…");
    const submit = page.getByRole("button", { name: "Masuk" });
    await expect(submit).toBeDisabled();

    await input.fill("ge_salah");
    await submit.click();
    await expect(page.getByText(/token/i).last()).toBeVisible();
    await expect(page).toHaveURL(/\/access/);

    await input.fill("ge_e2e");
    await submit.click();
    await expect(page).toHaveURL(/\/plan/);
  });
});

test.describe("kosakata", () => {
  test("tandai hafal menyimpan kata ke progres", async ({ page, api }) => {
    await openApp(page, "/vocab");
    const mark = page
      .getByRole("button", { name: "Tandai hafal", exact: true })
      .first();
    await mark.click();
    await expect(
      page.getByRole("button", { name: "✓ Hafal", exact: true }).first(),
    ).toBeVisible();
    await expect
      .poll(() => Object.keys((api.lastPut("known") as object) ?? {}), {
        timeout: 10_000,
      })
      // The word itself, plus the same word in other levels (word twins).
      .toContainEqual(expect.stringMatching(/^1:w:/));
  });

  test("mode tes menyembunyikan arti sampai dibuka", async ({ page }) => {
    await openApp(page, "/vocab");
    await expect(page.getByText("adalah / berada").first()).toBeVisible();
    await toggleVocabMode(page, /Mode tes/);
    await expect(page.getByText("adalah / berada")).toHaveCount(0);
    await page
      .getByRole("button", { name: /Tebak artinya dulu/ })
      .first()
      .click();
    await expect(page.getByText("adalah / berada").first()).toBeVisible();
  });

  test("mode ketik memeriksa jawaban", async ({ page }) => {
    await openApp(page, "/vocab");
    await toggleVocabMode(page, /Mode ketik/);
    const box = page.getByPlaceholder(/Ketik kata Inggrisnya/).first();
    await box.fill("be");
    await box.press("Enter");
    await expect(
      page
        .getByRole("heading", { name: "be" })
        .or(page.getByText(/^be$/))
        .first(),
    ).toBeVisible();
  });

  test("tes cepat: jawab satu soal lalu lanjut", async ({ page }) => {
    await openApp(page, "/vocab");
    await startQuickTest(page);
    await expect(page.getByText(/SOAL 1 \/ 20/i)).toBeVisible();
    await quizOptions(page).first().click();
    await page.getByRole("button", { name: "Soal berikutnya" }).click();
    await expect(page.getByText(/SOAL 2 \/ 20/i)).toBeVisible();
  });
});

test.describe("ulang", () => {
  test.use({ mock: { progress: progressWithDue() } });

  test("satu sesi ulang menaikkan tahap SRS", async ({ page, api }) => {
    await openApp(page, "/review");
    for (let i = 0; i < DUE_KEYS.length; i++) {
      await page.getByRole("button", { name: "Buka jawaban" }).click();
      await page.getByRole("button", { name: /Ingat/ }).click();
    }
    await expect
      .poll(() => {
        const srs = (api.lastPut("srs") ?? {}) as Record<
          string,
          { st: number }
        >;
        return DUE_KEYS.every((k) => srs[k]?.st === 2);
      })
      .toBe(true);
    await expect.poll(() => (api.lastPut("done") as { n?: number })?.n).toBe(3);
  });
});

test.describe("grammar", () => {
  test("latihan tiga tahap: pilihan ganda, susun kata, ketik", async ({
    page,
    api,
  }) => {
    await openApp(page, "/grammar/thit");
    const feedback = page.getByText(/^(Benar\.|Kurang tepat\.)/).first();

    await page.getByRole("button", { name: "Mulai 20 soal" }).first().click();
    await expect(page.getByText("SOAL 1 / 20").first()).toBeVisible();
    await page.getByTestId("practice-option").first().click();
    await expect(feedback).toBeVisible();

    await page.getByRole("button", { name: /^2 · / }).click();
    const tokens = page.getByTestId("practice-token");
    await expect(tokens.first()).toBeVisible();
    const n = await tokens.count();
    for (let i = 0; i < n; i++) await tokens.nth(i).click();
    await expect(feedback).toBeHidden();
    await page.getByRole("button", { name: "Periksa" }).click();
    await expect(feedback).toBeVisible();

    await page.getByRole("button", { name: /^3 · / }).click();
    const typed = page.getByPlaceholder(/Ketik isian/).first();
    await typed.fill("is");
    await typed.press("Enter");
    await expect(feedback).toBeVisible();

    // Per-set stats are saved to the server.
    await expect.poll(() => api.lastPut("askprac")).toBeTruthy();
  });
});

test.describe("tanya AI", () => {
  test("kirim pertanyaan, jawaban mengalir masuk", async ({ page, api }) => {
    await openApp(page, "/plan");
    const panel = await openAiPanel(page);
    await panel
      .getByPlaceholder(/Tanya apa saja/)
      .fill("kalau used to artinya apa?");
    await panel.getByRole("button", { name: "Kirim" }).click();
    await expect(
      panel.getByText("Run out of dipakai dengan benda."),
    ).toBeVisible();
    expect(api.chats).toHaveLength(1);
  });

  test.describe("kuota habis", () => {
    test.use({ mock: { aiUsage: { used: 20, limit: 20 } } });

    test("kartu kuota habis, kolom dan Kirim nonaktif", async ({ page }) => {
      await openApp(page, "/plan");
      const panel = await openAiPanel(page);
      await expect(panel.getByText("KUOTA HARI INI HABIS")).toBeVisible();
      await expect(panel.getByText(/habis/i).first()).toBeVisible();
      await expect(
        panel.getByRole("textbox", { name: "Pertanyaan" }),
      ).toBeDisabled();
      await expect(panel.getByRole("button", { name: "Kirim" })).toBeDisabled();
    });
  });
});

test.describe("pencarian global", () => {
  test("memilih hasil melompat ke kata di Kosakata", async ({ page }) => {
    await openApp(page, "/plan");
    await (await globalSearchInput(page)).fill("run out of");
    await expect(searchResults(page).first()).toBeVisible();
    await searchResults(page).first().click();
    await expect(page).toHaveURL(/\/vocab/);
    await expect(page.getByText("run out of").first()).toBeVisible();
  });
});

test.describe("ekspor dan impor", () => {
  test.use({ mock: { progress: progressWithDue() } });

  test("file ekspor bisa diimpor kembali", async ({ page, api }) => {
    await openApp(page, "/plan");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      clickAccountAction(page, "Ekspor progres"),
    ]);
    const file = await download.path();
    const data = JSON.parse(await readFile(file, "utf8"));
    // The same words in Pemula count as memorised too (word twins).
    expect(Object.keys(data.known)).toEqual(expect.arrayContaining(DUE_KEYS));

    await importInput(page).setInputFiles({
      name: "progres.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({ ...data, known: { ...data.known, "2:w:work": 1 } }),
      ),
    });
    await expect
      .poll(() => Object.keys((api.lastPut("known") as object) ?? {}))
      .toContain("2:w:work");
  });
});

test.describe("token terbatas", () => {
  test.use({ mock: { session: limitedSession } });

  test("hanya menu dan level yang diizinkan tampil, tanpa Tanya AI", async ({
    page,
  }) => {
    await openApp(page, "/plan");
    await expect(navLink(page, /Kosakata/).first()).toBeVisible();
    await expect(navLink(page, /Skenario/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Tanya AI" })).toHaveCount(0);
    await page.goto("/scenario");
    await expect(page).toHaveURL(/\/plan/);
  });
});
