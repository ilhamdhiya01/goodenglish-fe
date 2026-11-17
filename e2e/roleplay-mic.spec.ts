import type { Page } from "@playwright/test";

import { openApp } from "./support/app";
import { expect, test } from "./support/fixtures";
import { roleplaySession } from "./support/mock-api";

// "Main peran" mic: Chromium's fake microphone (a steady tone) is recorded
// with MediaRecorder and uploaded as multipart; the mocked backend stands in
// for the self-hosted Whisper.

test.use({
  mock: { session: roleplaySession, progress: { level: "beginner" } },
  permissions: ["microphone"],
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  },
});

const answerBox = (page: Page) =>
  page.getByRole("textbox", { name: "Jawabanmu" });

const start = async (page: Page) => {
  await openApp(page, "/scenario/roleplay/order");
  await expect(page.getByText(/dituliskan apa adanya/)).toBeVisible();
  await page.getByRole("button", { name: "Mulai main peran" }).click();
  await expect(page.getByText("Hi! What can I get for you?")).toBeVisible();
};

const record = async (page: Page, ms = 1200) => {
  const mic = page.getByRole("button", { name: "Bicara (mikrofon)" });
  await mic.click();
  const stop = page.getByRole("button", { name: "Berhenti merekam" });
  await expect(stop).toHaveAttribute("data-state", "recording");
  await expect(page.getByText(/0:0\d \/ 1:00/)).toBeVisible();
  await expect(
    page.getByText(/Merekam \(bahasa (Inggris|Indonesia)\)/),
  ).toBeVisible();
  await page.waitForTimeout(ms);
  await stop.click();
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("ge-stt-lang-v1"));
});

test("rekam (EN), teks masuk ke kotak, bisa diedit, baru dikirim", async ({
  page,
  api,
}) => {
  await start(page);
  // English unless Indonesian is picked in the language menu.
  await expect(
    page.getByRole("button", { name: "Bahasa jawaban: bahasa Inggris" }),
  ).toHaveText(/EN/);
  await answerBox(page).fill("Hello,");
  await record(page);

  // Appended after what was typed; not sent by itself.
  await expect(answerBox(page)).toHaveValue("Hello, I go to event yesterday");
  expect(api.roleplay.some((c) => c.path.endsWith("/turn"))).toBe(false);

  const call = api.roleplay.find((c) => c.path.endsWith("/transcribe"));
  const body = call!.body as {
    contentType: string;
    language: string;
    fileName: string;
    fileType: string;
    bytes: number;
  };
  expect(body.contentType).toMatch(/^multipart\/form-data; boundary=/);
  expect(body.language).toBe("en");
  expect(body.fileName).toBe("answer.webm");
  expect(body.fileType).toMatch(/^audio\/webm/);
  expect(body.bytes).toBeGreaterThan(1000);

  await answerBox(page).fill("Hello, I went to an event yesterday");
  await page.getByRole("button", { name: "Kirim" }).click();
  await expect(page.getByText("Sure. Anything else?")).toBeVisible();
  const turn = api.roleplay.find((c) => c.path.endsWith("/turn"));
  const lines = (turn!.body as { transcript: { text: string }[] }).transcript;
  expect(lines[lines.length - 1].text).toBe(
    "Hello, I went to an event yesterday",
  );
});

test("pilihan ID dikirim ke server dan diingat", async ({ page, api }) => {
  await start(page);
  await page
    .getByRole("button", { name: "Bahasa jawaban: bahasa Inggris" })
    .click();
  await page.getByRole("menuitemradio", { name: /^Indonesia \(ID\)/ }).click();
  await expect(
    page.getByRole("button", { name: "Bahasa jawaban: bahasa Indonesia" }),
  ).toHaveText(/ID/);
  await record(page, 800);
  await expect(answerBox(page)).toHaveValue("Saya mau dua kopi");
  const call = api.roleplay.find((c) => c.path.endsWith("/transcribe"));
  expect((call!.body as { language: string }).language).toBe("id");
  expect(
    await page.evaluate(() => localStorage.getItem("ge-stt-lang-v1")),
  ).toBe("id");
});

test.describe("tidak ada suara", () => {
  test.use({
    mock: {
      session: roleplaySession,
      progress: { level: "beginner" },
      roleplayTranscript: "",
    },
  });

  test("pesan 'tidak terdengar', kotak tetap kosong", async ({ page }) => {
    await start(page);
    await record(page, 800);
    await expect(
      page.getByRole("alert").filter({ hasText: "Suaramu tidak terdengar" }),
    ).toBeVisible();
    await expect(answerBox(page)).toHaveValue("");
    // Re-sending the same silence won't help: no "Coba lagi" here.
    await expect(page.getByRole("button", { name: "Coba lagi" })).toHaveCount(
      0,
    );
  });
});
