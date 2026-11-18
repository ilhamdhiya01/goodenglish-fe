import { openApp } from "./support/app";
import { expect, test } from "./support/fixtures";
import { today } from "./support/mock-api";

// "Betulkan kalimat" by voice: Chromium's fake microphone is recorded and
// sent to /stt/transcribe (mocked), and the text fills the answer box.

test.use({
  mock: {
    progress: {
      level: "pre",
      mistakes: {
        v: 2,
        items: [
          {
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
            count: 1,
            status: "active",
            srs: { st: 0, due: today() - 1, streak: 0, lastGap: 1, reps: 1 },
          },
        ],
        reviewOn: true,
        intro: { day: 0, n: 0 },
      },
    },
  },
  permissions: ["microphone"],
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  },
});

test("rekam: hasilnya masuk ke kotak jawaban", async ({ page }) => {
  await openApp(page, "/review");
  await page.getByRole("button", { name: "Jawab dengan suara" }).click();
  await expect(page.getByText(/Merekam…/)).toBeVisible();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Berhenti merekam" }).click();
  await expect(
    page.getByRole("textbox", { name: /Ucapkan atau ketik/ }),
  ).toHaveValue("She goes to school.");
});
