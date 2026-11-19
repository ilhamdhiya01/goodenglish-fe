import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { openAiPanel, openApp } from "./support/app";
import { expect, test } from "./support/fixtures";
import { spoken, today } from "./support/mock-api";

// "Buku kesalahanku": mistakes from the features land in Kesalahan umum ›
// Punyaku (no duplicates), and come back in Ulang as "Betulkan kalimat".

const dueMistake = (o: object = {}) => ({
  id: "mk1",
  key: "she go to school→she goes to school",
  source: "Grammar",
  wrong: "She go to school.",
  correct: "She goes to school.",
  explanation_id: "He/she/it pakai -s.",
  category: "aturan-dasar",
  level: "pre",
  createdAt: "2026-11-10T00:00:00.000Z",
  lastAt: "2026-11-12T00:00:00.000Z",
  count: 2,
  status: "active",
  srs: { st: 1, due: today() - 1, streak: 1, lastGap: 3, reps: 1 },
  ...o,
});
const withDue = {
  level: "pre",
  mistakes: {
    v: 2,
    items: [dueMistake()],
    reviewOn: true,
    intro: { day: 0, n: 0 },
  },
};

type Doc = {
  reviewOn: boolean;
  items: {
    source: string;
    category: string;
    count: number;
    status: string;
    wrong: string;
    srs: { reps: number; due: number };
  }[];
};
const doc = (api: { lastPut: (k: string) => unknown }) =>
  api.lastPut("mistakes") as Doc | undefined;

const axe = async (page: Page, where: string) => {
  // Let fades finish (axe reads colors mid-animation).
  await page.waitForTimeout(300);
  const { violations } = await new AxeBuilder({ page })
    .include("main")
    .analyze();
  expect(
    violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
    ),
    where,
  ).toEqual([]);
};

test.describe("Ulang", () => {
  test.use({ mock: { progress: withDue } });

  test("kartu Betulkan kalimat: ketik, Enter, Ingat", async ({ page, api }) => {
    await openApp(page, "/review");
    await expect(page.getByText(/BETULKAN KALIMAT/)).toBeVisible();
    await expect(page.getByText("1 kesalahan jatuh tempo")).toBeVisible();
    await expect(page.getByText("She go to school.")).toBeVisible();
    await axe(page, "kartu kesalahan");

    const box = page.getByRole("textbox", {
      name: /Ucapkan atau ketik versi yang benar/,
    });
    await box.fill("she goes to school");
    await box.press("Enter");
    await expect(page.getByText(/sama dengan jawaban benar/)).toBeVisible();
    await expect(page.getByText("He/she/it pakai -s.")).toBeVisible();
    await page.keyboard.press("3");

    await expect.poll(() => doc(api)?.items[0].srs.reps).toBe(2);
    expect(doc(api)!.items[0].srs.due).toBeGreaterThan(today());
    await expect(page.getByText(/BETULKAN KALIMAT/)).toHaveCount(0);
  });

  test("toggle mati: kartu kesalahan hilang; Blok 1 lewat kuis, bukan otomatis", async ({
    page,
    api,
  }) => {
    await openApp(page, "/review");
    await expect(page.getByText(/BETULKAN KALIMAT/)).toBeVisible();
    await page
      .getByRole("button", { name: /Sertakan kartu kesalahan/ })
      .click();
    await expect(page.getByText(/BETULKAN KALIMAT/)).toHaveCount(0);
    await expect.poll(() => doc(api)?.reviewOn).toBe(false);
    // Nothing due and nothing reviewed: no tick, the 5-question quiz instead.
    await expect
      .poll(() => JSON.stringify(api.lastPut("plan") ?? {}))
      .toContain('"b1":false');
    const quiz = page.getByText(/KUIS PENGGANTI ULANG/);
    await expect(quiz).toBeVisible();
    for (let i = 0; i < 5; i++) {
      await page
        .getByText("Mana kalimat yang benar?")
        .locator("..")
        .getByRole("button")
        .first()
        .click();
      await page
        .getByRole("button", { name: /^(Soal berikutnya|Selesai)/ })
        .click();
    }
    await expect(page.getByText(/Kuis selesai/)).toBeVisible();
    await expect
      .poll(() => JSON.stringify(api.lastPut("plan") ?? {}))
      .toContain('"b1":true');
  });
});

test.describe("Ulang: kesalahan Dikte", () => {
  test.use({
    mock: {
      progress: {
        level: "pre",
        mistakes: {
          v: 2,
          items: [
            dueMistake({
              id: "mk2",
              key: "work start at nine→work starts at nine",
              source: "Dikte",
              category: "menyimak",
              wrong: "work start at nine",
              correct: "Work starts at nine.",
              explanation_id: "Salah dengar: start (seharusnya starts).",
            }),
          ],
          reviewOn: true,
          intro: { day: 0, n: 0 },
        },
      },
    },
  });

  test("diputar, bukan ditampilkan; ditandai per kata", async ({ page }) => {
    await openApp(page, "/review");
    await expect(page.getByText(/DENGAR & TULIS ULANG/)).toBeVisible();
    // The sentence is heard, not read.
    await expect(page.getByText("work start at nine")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Jawab dengan suara" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Putar", exact: true }).click();
    await expect.poll(() => spoken(page)).toContain("Work starts at nine.");

    const box = page.getByRole("textbox", { name: /Tulis yang kamu dengar/ });
    await box.fill("work start at nine");
    await box.press("Enter");
    await expect(page.getByText("TULISANMU SEKARANG")).toBeVisible();
    await expect(page.getByText("(yang benar starts)")).toBeAttached();
    await expect(page.getByText("Tulisanmu dulu:")).toBeVisible();
    await expect(page.getByText("Work starts at nine.")).toBeVisible();
    await axe(page, "kartu dengar ulang");
  });
});

test.describe("Punyaku", () => {
  test.use({
    mock: {
      progress: { level: "pre" },
      aiReply: "Hampir benar. **She goes home.** He/she/it pakai -s.",
      aiCheck: {
        original: "She go home.",
        isCorrect: false,
        corrected: "She goes home.",
        explanationId: "He/she/it pakai -s.",
        category: "aturan-dasar",
      },
    },
  });
  test.describe.configure({ timeout: 90_000 });

  test("Tanya AI dan kuis masuk tanpa duplikat; filter, arsip, aturan", async ({
    page,
    api,
  }) => {
    await openApp(page, "/errors?bagian=punyaku");
    await expect(
      page.getByText("Buku kesalahanmu masih kosong."),
    ).toBeVisible();

    // The same sentence checked twice: one card, "terjadi 2 kali".
    const panel = await openAiPanel(page);
    for (let i = 0; i < 2; i++) {
      await panel
        .getByRole("textbox", { name: "Pertanyaan" })
        .fill("She go home.");
      await panel.getByRole("button", { name: "Kirim" }).click();
      await expect(panel.getByText(/Hampir benar/).nth(i)).toBeVisible();
    }
    // The hidden check never shows in the chat.
    await expect(panel.getByText(/is_correct|<<<CEK/)).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect.poll(() => doc(api)?.items[0]?.count).toBe(2);
    expect(doc(api)!.items[0]).toMatchObject({
      source: "Tanya AI",
      category: "aturan-dasar",
      wrong: "She go home.",
    });
    await expect(
      page.getByText("terjadi 2 kali", { exact: false }),
    ).toBeVisible();

    // Kuis Kesalahan umum: answer until one is wrong.
    await page.getByRole("button", { name: /^Kuis/ }).click();
    for (let k = 0; k < 12; k++) {
      await page.getByTestId("error-option").first().click();
      if (await page.getByText(/^✕ Yang benar:/).isVisible()) break;
      await page.getByRole("button", { name: /Soal berikutnya/ }).click();
    }
    await expect
      .poll(() => doc(api)?.items.map((m) => m.source))
      .toContain("Kuis Kesalahan umum");

    await page.getByRole("button", { name: /^Punyaku/ }).click();
    await expect(page).toHaveURL(/bagian=punyaku/);
    await expect(page.getByText("2 kesalahan", { exact: true })).toBeVisible();
    await expect(page.getByText("KATEGORI TERBANYAK")).toBeVisible();
    await axe(page, "punyaku");

    await page.getByLabel("Sumber").selectOption("Tanya AI");
    await expect(page.getByText("1 kesalahan", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Arsipkan" }).click();
    await expect(page.getByText("0 kesalahan", { exact: true })).toBeVisible();
    await expect
      .poll(() => doc(api)?.items.find((m) => m.source === "Tanya AI")?.status)
      .toBe("archived");
    await page.getByLabel("Status").selectOption("archived");
    await expect(page.getByText("She goes home.")).toBeVisible();

    await page.getByRole("link", { name: "Pelajari aturannya" }).click();
    await expect(page).toHaveURL(/\/cheatsheet#aturan-dasar$/);
    await expect(page.locator("#aturan-dasar")).toBeInViewport();
  });

  test("latihan grammar: jawaban salah tercatat dengan kategorinya", async ({
    page,
    api,
  }) => {
    await openApp(page, "/grammar/thit");
    await page.getByRole("button", { name: "Mulai 20 soal" }).first().click();
    for (let k = 0; k < 12; k++) {
      await page.getByTestId("practice-option").last().click();
      if (
        await page
          .getByText(/^Kurang tepat\./)
          .first()
          .isVisible()
      )
        break;
      await page.getByRole("button", { name: "Soal berikutnya" }).click();
    }
    await expect
      .poll(() => doc(api)?.items[0])
      .toMatchObject({ source: "Grammar", category: "am-is-are" });
  });
});
