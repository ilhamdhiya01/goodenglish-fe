import AxeBuilder from "@axe-core/playwright";

import { acceptConfirm, navLink, openApp } from "./support/app";
import { expect, test } from "./support/fixtures";
import {
  adminSession,
  readingSession,
  spoken,
  today,
} from "./support/mock-api";

// "Bacaan": list → read → tap words → save to Ulang → listen → 5 questions.

test.describe("pelajar", () => {
  test.use({ mock: { session: readingSession, progress: { level: "pre" } } });
  test.describe.configure({ timeout: 90_000 });

  test("skor di bawah 4/5: belum selesai, soal boleh diulang sekali", async ({
    page,
    api,
  }) => {
    await openApp(page, "/reading/rt1");
    await page
      .getByRole("button", { name: /Selesai membaca · jawab 5 soal/ })
      .click();
    const answerWrong = async () => {
      for (let i = 0; i < 3; i++)
        await page
          .getByRole("button", { name: /Wrong 1/ })
          .nth(i)
          .click();
      await page
        .getByRole("button", { name: /Salah$/ })
        .first()
        .click();
      await page.getByRole("textbox", { name: "Jawaban soal 5" }).fill("rain");
      await page.getByRole("button", { name: "Periksa jawaban" }).click();
    };
    await answerWrong();
    await expect(page.getByText("BELUM SELESAI")).toBeVisible();
    await page.getByRole("button", { name: "Ulangi soal (sekali)" }).click();
    await answerWrong();
    await expect(page.getByText("BELUM SELESAI")).toBeVisible();
    // The one retry is used: only "Baca lagi" now.
    await expect(
      page.getByRole("button", { name: "Ulangi soal (sekali)" }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Baca lagi" })).toBeVisible();
    // Both tries are scored, the text isn't done.
    await expect
      .poll(
        () =>
          (api.lastPut("reading") as { results?: unknown[] } | undefined)
            ?.results?.length,
      )
      .toBe(2);
    expect(
      (api.lastPut("reading") as { done?: object } | undefined)?.done ?? {},
    ).toEqual({});
  });

  test("daftar, baca, tap kata, simpan, soal, selesai", async ({
    page,
    api,
  }) => {
    await openApp(page, "/reading");
    await expect(
      page.getByRole("heading", { name: "Bacaan", level: 2 }),
    ).toBeVisible();
    await expect(page.getByText("· minggu ini")).toBeVisible();
    await expect(page.getByText("Belum dibaca")).toHaveCount(2);

    await page.getByRole("link", { name: /A rainy morning/ }).click();
    await expect(page).toHaveURL(/\/reading\/rt1$/);
    await expect(
      page.getByRole("heading", { name: "A rainy morning", level: 2 }),
    ).toBeVisible();

    // A word in neither Kosakata nor the glossary: asked once, then cached.
    await page.getByRole("button", { name: "quokka", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: 'Arti kata "quokka"' });
    await expect(sheet.getByText("arti-quokka")).toBeVisible();
    await expect(sheet.getByText("Arti dari AI")).toBeVisible();
    await sheet.getByRole("button", { name: "Simpan ke Ulang" }).click();
    await expect(
      sheet.getByText(/Disimpan sebagai kartu pribadi/),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    await expect
      .poll(() => api.lastPut("custom") as { en: string }[] | undefined)
      .toEqual([
        expect.objectContaining({
          en: "quokka",
          id: "arti-quokka",
          level: "pre",
          week: 1,
          personal: true,
          source: "Bacaan: A rainy morning",
        }),
      ]);
    await expect
      .poll(
        () =>
          (api.lastPut("srs") as Record<string, unknown> | undefined)?.[
            "1:w:quokka"
          ],
      )
      .toEqual({ st: 0, due: today() + 1 });

    await page.getByRole("button", { name: "quokka", exact: true }).click();
    await expect(sheet.getByText("Sudah ada di Ulang.")).toBeVisible();
    await page.keyboard.press("Escape");
    expect(
      api.reading.filter((c) => c.call === "POST /reading/lookup"),
    ).toHaveLength(1);

    // Glossary word: no server call.
    await page.getByRole("button", { name: "puddle", exact: true }).click();
    const gl = page.getByRole("dialog", { name: 'Arti kata "puddle"' });
    await expect(gl.getByText("genangan air")).toBeVisible();
    await expect(gl.getByText("Glosarium bacaan ini")).toBeVisible();
    await page.keyboard.press("Escape");

    // A word of this week (underlined), meaning from Kosakata.
    await page.getByRole("button", { name: "have", exact: true }).click();
    const kv = page.getByRole("dialog", { name: 'Arti kata "have"' });
    await expect(kv.getByText("punya / makan (meal)")).toBeVisible();
    await expect(kv.getByText(/Kosakata · .* minggu 1/)).toBeVisible();
    await page.keyboard.press("Escape");
    expect(
      api.reading.filter((c) => c.call === "POST /reading/lookup"),
    ).toHaveLength(1);

    // Translation and audio.
    await page.getByRole("button", { name: "Terjemahan paragraf 1" }).click();
    await expect(page.getByText(/Aku punya mainan quokka kecil/)).toBeVisible();
    await page.getByRole("button", { name: "Putar semua" }).click();
    await expect
      .poll(() => spoken(page))
      .toEqual(
        expect.arrayContaining([
          "I have a small quokka toy.",
          "It can be fun to jump in a puddle!",
        ]),
      );

    // The 5 questions.
    await page
      .getByRole("button", { name: /Selesai membaca · jawab 5 soal/ })
      .click();
    const check = page.getByRole("button", { name: "Periksa jawaban" });
    await expect(check).toBeDisabled();
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: /Right/ }).nth(i).click();
    }
    await page
      .getByRole("button", { name: /Benar$/ })
      .first()
      .click();
    await page.getByRole("textbox", { name: "Jawaban soal 5" }).fill("Puddles");
    await check.click();
    await expect(page.getByText("Skor 5/5")).toBeVisible();
    await expect(page.getByText(/1 kata disimpan ke Ulang/)).toBeVisible();
    await expect(page.getByText("Penjelasan 1.")).toBeVisible();

    await expect
      .poll(
        () =>
          (api.lastPut("reading") as { done?: object } | undefined)?.done ?? {},
      )
      .toHaveProperty("rt1");
    const doc = api.lastPut("reading") as {
      results: { score: number; savedWords: number; textId: string }[];
    };
    expect(doc.results[0]).toMatchObject({
      textId: "rt1",
      score: 5,
      savedWords: 1,
    });

    await page.getByRole("link", { name: "Kembali ke daftar" }).click();
    await expect(page.getByText("Selesai", { exact: true })).toBeVisible();

    // The private card in Kosakata › Jenis › Kataku (pribadi).
    // In-app navigation: the mock doesn't keep saved progress across reloads.
    await navLink(page, "Kosakata").filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/\/vocab/);
    await page.getByRole("button", { name: "Jenis" }).click();
    await page
      .getByRole("dialog", { name: "Jenis kata" })
      .getByRole("button", { name: /Kataku \(pribadi\)/ })
      .click();
    // The card renders its badges in two layouts; one is visible.
    await expect(
      page.getByText("PRIBADI", { exact: true }).filter({ visible: true }),
    ).toHaveCount(1);
    await expect(
      page.getByText("Bacaan: A rainy morning").filter({ visible: true }),
    ).toHaveCount(1);
  });

  test("axe: daftar, layar baca, popup kata, soal", async ({ page }) => {
    const check = async (where: string) => {
      const { violations } = await new AxeBuilder({ page })
        .include("main")
        .analyze();
      expect(
        violations.map((v) => `${v.id}: ${v.help}`),
        where,
      ).toEqual([]);
    };
    await openApp(page, "/reading");
    await check("daftar");
    await page.getByRole("link", { name: /A rainy morning/ }).click();
    await expect(
      page.getByRole("heading", { name: "A rainy morning", level: 2 }),
    ).toBeVisible();
    await check("baca");
    await page.getByRole("button", { name: "puddle", exact: true }).click();
    await expect(
      page.getByRole("dialog").getByText("genangan air"),
    ).toBeVisible();
    // Let the sheet's fade/slide-in finish (axe reads colors mid-animation).
    await page.waitForTimeout(500);
    const { violations } = await new AxeBuilder({ page })
      .include("[role=dialog]")
      .analyze();
    expect(
      violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
      ),
    ).toEqual([]);
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: /Selesai membaca · jawab 5 soal/ })
      .click();
    await check("soal");
  });
});

test.describe("belum ada bacaan", () => {
  test.use({
    mock: {
      session: readingSession,
      progress: { level: "pre" },
      readingTexts: [],
    },
  });

  test("menampilkan pesan, bukan error", async ({ page }) => {
    await openApp(page, "/reading");
    await expect(
      page.getByText(/Belum ada bacaan untuk level ini/),
    ).toBeVisible();
  });
});

test.describe("admin", () => {
  test.use({ mock: { session: adminSession } });

  test("buat draf, peringatan, ubah, terbitkan, hapus", async ({
    page,
    api,
  }) => {
    await page.goto("/admin/reading");
    const warned = page.locator("li", { hasText: "Warned draft" });
    await expect(
      warned.getByText("Panjang teks 19 kata (seharusnya 150–200)."),
    ).toBeVisible();

    await page.getByRole("combobox", { name: "Teks" }).selectOption("B");
    await page.getByRole("button", { name: "Buat draf Teks B" }).click();
    // The new draft opens in a popup to check it.
    const fresh = page.getByRole("dialog", {
      name: "Isi bacaan Generated text",
    });
    await expect(fresh).toBeVisible();
    await fresh.getByRole("button", { name: "Tutup" }).click();
    await expect(fresh).toHaveCount(0);
    await expect(
      page.getByText("Generated text", { exact: true }),
    ).toBeVisible();
    const gen = api.reading.find(
      (c) => c.call === "POST /admin/reading/generate",
    );
    expect(gen!.body).toMatchObject({ level: "pre", week: 1, slot: "B" });
    expect((gen!.body as { words: string[] }).words.length).toBeGreaterThan(5);

    // Publishing a draft with warnings asks first.
    await warned.getByRole("button", { name: "Terbitkan" }).click();
    await expect(page.getByRole("alertdialog")).toContainText(
      "Yakin terbitkan?",
    );
    await acceptConfirm(page, "Terbitkan");
    await expect
      .poll(() => api.reading.map((c) => c.call))
      .toContain("POST /admin/reading/rd1/publish");
    // Published on purpose despite the warnings.
    expect(
      api.reading.find((c) => c.call === "POST /admin/reading/rd1/publish")
        ?.body,
    ).toEqual({ force: true });
    await expect(warned.getByText("Terbit", { exact: true })).toBeVisible();

    await warned.getByRole("button", { name: "Lihat isi" }).click();
    const content = page.getByRole("dialog", { name: /^Isi bacaan/ });
    await expect(content.getByText(/Kata target:/)).toBeVisible();
    await content.getByRole("button", { name: "Tutup" }).click();
    await warned.getByRole("button", { name: "Ubah" }).click();
    const form = page.getByRole("dialog", { name: /^Ubah bacaan/ });
    await form.getByLabel("Judul").fill("Edited reading");
    await form.getByRole("button", { name: "Simpan" }).click();
    await expect(form).toHaveCount(0);
    await expect
      .poll(
        () =>
          api.reading.find((c) => c.call === "PATCH /admin/reading/rd1")?.body,
      )
      .toMatchObject({ title: "Edited reading" });
    const patch = api.reading.find(
      (c) => c.call === "PATCH /admin/reading/rd1",
    )!.body as { words: string[]; questions: unknown[] };
    expect(patch.words.length).toBeGreaterThan(5);
    expect(patch.questions).toHaveLength(5);

    const edited = page.locator("li", { hasText: "Edited reading" });
    await edited.getByRole("button", { name: "Sembunyikan" }).click();
    await expect
      .poll(() => api.reading.map((c) => c.call))
      .toContain("POST /admin/reading/rd1/unpublish");
    await edited.getByRole("button", { name: "Hapus" }).click();
    await acceptConfirm(page, "Hapus");
    await expect
      .poll(() => api.reading.map((c) => c.call))
      .toContain("DELETE /admin/reading/rd1");
    await expect(page.getByText("Edited reading")).toHaveCount(0);
  });
});

test.describe("admin: arti kata", () => {
  test.use({ mock: { session: adminSession } });

  test("arti kata dari AI bisa diubah dan dihapus", async ({ page, api }) => {
    await openApp(page, "/admin/reading");
    const list = page.getByRole("list", { name: "Arti kata tersimpan" });
    const row = list.locator("li", { hasText: "went" });
    await expect(row).toContainText("The light went out.");
    await row.getByRole("button", { name: "Ubah" }).click();
    await row.getByLabel("Arti").fill("padam");
    await row.getByRole("button", { name: "Simpan" }).click();
    await expect
      .poll(
        () =>
          api.reading.find((c) => c.call === "PATCH /admin/word-meanings/wm1")
            ?.body,
      )
      .toMatchObject({ meaningId: "padam" });
    await expect(row).toContainText("= padam");

    await row.getByRole("button", { name: "Hapus" }).click();
    await acceptConfirm(page, "Hapus");
    await expect
      .poll(() => api.reading.map((c) => c.call))
      .toContain("DELETE /admin/word-meanings/wm1");
    await expect(
      page.getByText("Belum ada arti kata tersimpan di level ini."),
    ).toBeVisible();
  });
});
