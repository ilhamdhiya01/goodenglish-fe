import type { Page } from "@playwright/test";

import { acceptConfirm, openAiPanel, openApp } from "./support/app";
import { expect, test } from "./support/fixtures";

// Tanya AI after the redesign: beside the page on wide screens, full screen
// on phones; history, delete, new conversation, opening from a word card.

const isDesktop = (page: Page) => page.viewportSize()!.width >= 1100;

test("desktop: panel menggeser isi, halaman tetap bisa dipakai", async ({
  page,
}) => {
  test.skip(!isDesktop(page), "push layout is ≥1100px only");
  await openApp(page, "/vocab");
  const panel = await openAiPanel(page);
  const box = (await panel.boundingBox())!;
  const main = (await page.locator("main").boundingBox())!;
  expect(main.x + main.width).toBeLessThanOrEqual(box.x + 1);

  // A press on the page doesn't close it; the top-bar button does.
  await page.getByRole("heading", { level: 2 }).first().click();
  await expect(panel).toBeVisible();
  await page.getByRole("button", { name: "Tanya AI", exact: true }).click();
  await expect(panel).toHaveCount(0);
});

test("HP: panel layar penuh", async ({ page }) => {
  test.skip(isDesktop(page), "full screen is the phone layout");
  await openApp(page, "/plan");
  const panel = await openAiPanel(page);
  const box = (await panel.boundingBox())!;
  expect(box.width).toBe(page.viewportSize()!.width);
});

test("riwayat: buka, hapus dengan konfirmasi", async ({ page }) => {
  await openApp(page, "/plan");
  const panel = await openAiPanel(page);
  await panel.getByRole("button", { name: "Riwayat" }).click();
  await expect(panel.getByText("run out of vs run out")).toBeVisible();

  const del = page.waitForRequest(
    (r) => r.method() === "DELETE" && r.url().includes("/ai/conversations/c1"),
  );
  await panel
    .getByRole("button", { name: "Hapus percakapan: run out of vs run out" })
    .click();
  await acceptConfirm(page, "Hapus");
  await del;

  await panel.getByRole("button", { name: /^run out of vs run out/ }).click();
  await expect(
    panel.getByText("bedanya run out of sama run out apa?"),
  ).toBeVisible();
});

test("percakapan baru mengosongkan obrolan", async ({ page }) => {
  await openApp(page, "/plan");
  const panel = await openAiPanel(page);
  await panel.getByRole("textbox", { name: "Pertanyaan" }).fill("halo");
  await panel.getByRole("button", { name: "Kirim" }).click();
  await expect(
    panel.getByText("Run out of dipakai dengan benda."),
  ).toBeVisible();
  await panel.getByRole("button", { name: "Percakapan baru" }).click();
  await expect(panel.getByText("Run out of dipakai dengan benda.")).toHaveCount(
    0,
  );
});

test("dibuka dari kartu kata: chip Kata ikut", async ({ page }) => {
  await openApp(page, "/vocab");
  await page
    .locator("article")
    .first()
    .getByRole("button", { name: "tanya AI" })
    .click();
  const panel = page.getByRole("dialog", { name: "Tanya AI" });
  await expect(panel.getByText("Kata: be")).toBeVisible();
});

test("riwayat: judul panjang terpotong, tidak meluber keluar panel", async ({
  page,
  context,
}) => {
  const title =
    'Buatkan 3 contoh kalimat tentang "Idiom yang sering dipakai native speaker". Kamu jawab pakai bahasa Indonesia ya';
  await context.route("**/api/v1/ai/conversations", (r) =>
    r.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "c1",
            title,
            updatedAt: new Date().toISOString(),
            messageCount: 2,
          },
        ],
      }),
    }),
  );
  await openApp(page, "/plan");
  const panel = await openAiPanel(page);
  await panel.getByRole("button", { name: "Riwayat" }).click();
  const row = panel.getByRole("button", { name: new RegExp("^Buatkan 3") });
  await expect(row).toBeVisible();
  const fits = await row.evaluate((btn) => {
    const title = btn.querySelector("span")!;
    const list = btn.closest("ul")!.parentElement!;
    return {
      titleInside:
        title.getBoundingClientRect().right <=
        btn.getBoundingClientRect().right + 1,
      truncated: title.scrollWidth > title.clientWidth,
      noSideScroll: list.scrollWidth <= list.clientWidth,
    };
  });
  expect(fits).toEqual({
    titleInside: true,
    truncated: true,
    noSideScroll: true,
  });
});

test("pesan dengan kata sangat panjang (URL) dipatah, obrolan tidak bergeser ke samping", async ({
  page,
}) => {
  const url =
    "https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md";
  await openApp(page, "/plan");
  const panel = await openAiPanel(page);
  await panel.getByRole("textbox", { name: "Pertanyaan" }).fill(url);
  await panel.getByRole("button", { name: "Kirim" }).click();
  await expect(
    panel.getByText("Run out of dipakai dengan benda."),
  ).toBeVisible();
  const mine = panel.getByText(url);
  const fits = await mine.evaluate((el) => {
    const list = el.closest(".overflow-y-auto")!;
    return {
      inside:
        el.getBoundingClientRect().right <=
        list.getBoundingClientRect().right + 1,
      noSideScroll: list.scrollWidth <= list.clientWidth,
    };
  });
  expect(fits).toEqual({ inside: true, noSideScroll: true });
});
