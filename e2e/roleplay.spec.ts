import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { openApp } from "./support/app";
import { expect, test } from "./support/fixtures";
import { roleplaySession, spoken } from "./support/mock-api";

// "Main peran": voice roleplay with the AI inside Skenario. Headless Chromium
// can't hear, so the microphone is either removed (Firefox-like: type mode)
// or replaced by a fake recogniser that "hears" a fixed sentence.

const beginner = { session: roleplaySession, progress: { level: "beginner" } };

/** No way to record (e.g. plain http has no mediaDevices): type only. */
const withoutMic = (page: Page) =>
  page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });
  });

const answerBox = (page: Page) =>
  page.getByRole("textbox", { name: "Jawabanmu" });

const start = async (page: Page, id = "order") => {
  await openApp(page, `/scenario/roleplay/${id}`);
  await page.getByRole("button", { name: "Mulai main peran" }).click();
  await expect(page.getByRole("list", { name: "Percakapan" })).toBeVisible();
};

test.describe("token tanpa izin Main peran", () => {
  test("tidak ada tombol Main peran di Skenario", async ({ page }) => {
    await openApp(page, "/scenario");
    await expect(
      page.getByRole("button", { name: "Putar semua" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Main peran", exact: true }),
    ).toHaveCount(0);
  });
});

test.describe("dengan izin Main peran", () => {
  test.use({ mock: beginner });

  test("tombol Main peran membuka layar persiapan", async ({ page }) => {
    await openApp(page, "/scenario");
    await page.getByRole("button", { name: "Main peran", exact: true }).click();
    await expect(page).toHaveURL(/\/scenario\/roleplay\/intro$/);
    await expect(page.getByText("MISIMU")).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Langkah misi" }),
    ).toBeVisible();
    await expect(
      page.getByText(/^Sisa 3 dari 3 sesi hari ini\./),
    ).toBeVisible();
    // Pemula: the AI's words are shown by default.
    await expect(
      page.getByRole("button", { name: "Tampilkan teks ucapan AI" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("latihan pendek dari Rencana: 6 giliran, dilaporkan saat selesai", async ({
    page,
    api,
  }) => {
    await withoutMic(page);
    await openApp(page, "/scenario/roleplay/order?mode=pendek");
    await expect(
      page.getByRole("button", { name: "Latihan pendek · 6 giliran" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Mulai main peran" }).click();
    await expect
      .poll(
        () =>
          (
            api.roleplay.find((c) => c.path === "/roleplay/sessions")?.body as
              { mode?: string } | undefined
          )?.mode,
      )
      .toBe("pendek");
    await answerBox(page).fill("I want two latte");
    await page.getByRole("button", { name: "Kirim" }).click();
    await expect(
      page.getByText("Giliran 1/6").filter({ visible: true }).first(),
    ).toBeVisible();
    await answerBox(page).fill("How much is it?");
    await answerBox(page).press("Enter");
    await expect(page.getByText("✓ MISI TERCAPAI")).toBeVisible();
    await expect
      .poll(() => api.laporan.find((l) => l.jenis === "main_peran_selesai"))
      .toMatchObject({
        data: { mode: "pendek", misi: true, scenarioId: "order" },
      });
  });

  test("sesi penuh dengan mengetik (browser tanpa input suara)", async ({
    page,
    api,
  }) => {
    await withoutMic(page);
    await openApp(page, "/scenario/roleplay/order");
    await expect(
      page.getByText(/Browser ini belum bisa merekam suara/).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "Mulai main peran" }).click();

    await expect(page.getByText("Hi! What can I get for you?")).toBeVisible();
    await expect
      .poll(() => spoken(page))
      .toContain("Hi! What can I get for you?");
    await expect(
      page.getByRole("button", { name: "Bicara (mikrofon)" }),
    ).toHaveCount(0);

    await answerBox(page).fill("I want two latte");
    await page.getByRole("button", { name: "Kirim" }).click();
    await expect(page.getByText("Sure. Anything else?")).toBeVisible();
    await expect(page.getByText("(selesai)")).toHaveCount(1);
    // Shown in the composer on phones and in the side panel on desktop.
    await expect(
      page.getByText("Giliran 1/12").filter({ visible: true }).first(),
    ).toBeVisible();

    // "Bantu aku": a suggestion fills the answer box.
    await page.getByRole("button", { name: "Bantuan" }).click();
    await page.getByRole("menuitem", { name: /^Bantu aku/ }).click();
    await page.getByRole("button", { name: "How much is it?" }).click();
    await expect(answerBox(page)).toHaveValue("How much is it?");
    await answerBox(page).press("Enter");

    // The mission is complete: straight to the summary.
    await expect(page.getByText("✓ MISI TERCAPAI")).toBeVisible();
    await expect(
      page.getByText("I want two lattes", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("LEBIH NATURAL")).toBeVisible();
    await expect(page.getByText(/\d+ giliran bicara/)).toBeVisible();

    const finish = api.roleplay.find((c) => c.path.endsWith("/finish"));
    expect((finish!.body as { transcript: unknown[] }).transcript).toHaveLength(
      5,
    );

    // Saved to the history and to the mistakes for Buku kesalahanku.
    await expect
      .poll(() => (api.lastPut("roleplay") as unknown[] | undefined)?.length)
      .toBe(1);
    const saved = (api.lastPut("roleplay") as Record<string, unknown>[])[0];
    expect(saved).toMatchObject({
      id: "rp1",
      scenarioId: "order",
      level: "beginner",
      missionComplete: true,
    });
    const mistakes = () =>
      (api.lastPut("mistakes") as { items?: Record<string, unknown>[] })?.items;
    await expect.poll(() => mistakes()?.length).toBe(1);
    expect(mistakes()![0]).toMatchObject({
      source: "Main peran",
      wrong: "I want two latte",
      correct: "I want two lattes",
      category: "kesalahan",
      level: "beginner",
    });

    await page.getByRole("button", { name: "Riwayat main peran" }).click();
    await expect(page).toHaveURL(/\/scenario\/history/);
    await expect(page.getByText("Memesan di kafe")).toBeVisible();
  });

  test("mikrofon rekam: izin ditolak → panduan, lalu mode ketik", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: () =>
            Promise.reject(
              Object.assign(new Error("denied"), { name: "NotAllowedError" }),
            ),
        },
      });
    });
    await start(page);
    await page.getByRole("button", { name: "Bicara (mikrofon)" }).click();
    await expect(page.getByText(/Izin mikrofon ditolak/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Bicara (mikrofon)" }),
    ).toHaveCount(0);
    await answerBox(page).fill("A latte, please");
    await expect(page.getByRole("button", { name: "Kirim" })).toBeEnabled();
  });

  test("Selesai tanpa jawaban kembali ke persiapan", async ({ page, api }) => {
    await withoutMic(page);
    await start(page);
    await page.getByRole("button", { name: "Selesai" }).click();
    await expect(page.getByText("MISIMU")).toBeVisible();
    expect(api.roleplay.some((c) => c.path.endsWith("/finish"))).toBe(false);
  });
});

test.describe("AI gagal", () => {
  test.use({ mock: { ...beginner, roleplayFailTurns: 1 } });

  test("giliran bisa dicoba ulang tanpa kehilangan transkrip", async ({
    page,
  }) => {
    await withoutMic(page);
    await start(page);
    await answerBox(page).fill("Two lattes, please");
    await page.getByRole("button", { name: "Kirim" }).click();
    // Next.js keeps its own (empty) role="alert" route announcer.
    const alert = page
      .getByRole("alert")
      .filter({ hasText: "AI sedang tidak bisa menjawab" });
    await expect(alert).toContainText("AI sedang tidak bisa menjawab");
    await expect(page.getByText("Two lattes, please")).toBeVisible();
    await alert.getByRole("button", { name: "Coba lagi" }).click();
    await expect(page.getByText("Sure. Anything else?")).toBeVisible();
    await expect(page.getByText("Two lattes, please")).toHaveCount(1);
  });
});

test.describe("level selain Pemula", () => {
  test.use({ mock: { session: roleplaySession, progress: { level: "pre" } } });

  test("teks ucapan AI disembunyikan sampai dibuka", async ({ page }) => {
    await withoutMic(page);
    await start(page);
    await expect(page.getByText("Hi! What can I get for you?")).toHaveCount(0);
    await page
      .getByRole("button", {
        name: "Dengarkan dulu, lalu klik untuk lihat teks",
      })
      .click();
    await expect(page.getByText("Hi! What can I get for you?")).toBeVisible();
  });
});

test.describe("kuota habis", () => {
  test.use({ mock: { ...beginner, roleplayUsage: { used: 3, limit: 3 } } });

  test("tombol Mulai mati dan ada penjelasan", async ({ page }) => {
    await openApp(page, "/scenario/roleplay/order");
    await expect(
      page.getByText("Jatah sesi hari ini sudah habis. Coba lagi besok, ya."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Mulai main peran" }),
    ).toBeDisabled();
  });
});

test.describe("riwayat Main peran", () => {
  test.use({
    mock: {
      session: roleplaySession,
      progress: {
        level: "pre",
        weeks: { pre: "1" },
        roleplay: [
          {
            id: "old1",
            scenarioId: "order",
            level: "pre",
            week: 1,
            startedAt: new Date().toISOString(),
            durationSec: 400,
            userTurns: 6,
            missionComplete: true,
            stepsDone: [0, 1, 2],
            transcript: [{ role: "ai", text: "Hi" }],
            summary: {
              missionComplete: true,
              summary: "Bagus!",
              corrections: [],
              moreNatural: [],
              keyPhrasesUsed: [],
              durationSec: 400,
              userTurns: 6,
              stepsDone: [0, 1, 2],
            },
          },
          {
            id: "old2",
            scenarioId: "hotel",
            level: "pre",
            week: 1,
            startedAt: new Date().toISOString(),
            durationSec: 260,
            userTurns: 5,
            missionComplete: false,
            stepsDone: [0],
            transcript: [{ role: "ai", text: "Hello" }],
            summary: {
              missionComplete: false,
              summary: "Lumayan!",
              corrections: [],
              moreNatural: [],
              keyPhrasesUsed: [],
              durationSec: 260,
              userTurns: 5,
              stepsDone: [0],
            },
          },
        ],
      },
    },
  });

  test("riwayat menampilkan kedua sesi, rangkuman bisa dibuka", async ({
    page,
  }) => {
    await openApp(page, "/scenario/history");
    await expect(page.getByText("Komplain di hotel")).toBeVisible();
    await page.getByRole("button", { name: /Komplain di hotel/ }).click();
    await expect(page.getByText("Lumayan!")).toBeVisible();
    await expect(page.getByText("Lihat transkrip (1 baris)")).toBeVisible();
  });
});

test.describe("aksesibilitas", () => {
  test.use({ mock: beginner });

  test("axe: persiapan, percakapan, dan rangkuman", async ({ page }) => {
    test.setTimeout(90_000);
    await withoutMic(page);
    const check = async (where: string) => {
      const { violations } = await new AxeBuilder({ page })
        .include("main")
        .analyze();
      expect(
        violations.map((v) => `${v.id}: ${v.help}`),
        where,
      ).toEqual([]);
    };
    await openApp(page, "/scenario/roleplay/order");
    await check("persiapan");
    await page.getByRole("button", { name: "Mulai main peran" }).click();
    await expect(page.getByText("Hi! What can I get for you?")).toBeVisible();
    await check("percakapan");
    await answerBox(page).fill("Two lattes");
    await page.getByRole("button", { name: "Kirim" }).click();
    await expect(page.getByText("Sure. Anything else?")).toBeVisible();
    await page.getByRole("button", { name: "Selesai" }).click();
    await expect(page.getByText(/MISI/).first()).toBeVisible();
    await check("rangkuman");
  });
});
