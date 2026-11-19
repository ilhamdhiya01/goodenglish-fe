import { openApp } from "./support/app";
import { expect, test } from "./support/fixtures";

// Saving progress safely: two devices of one token don't overwrite each
// other, a closed tab doesn't lose its last taps, and a network error never
// signs the learner out.

test.describe("dua perangkat", () => {
  test.use({ mock: { versionedProgress: true, progress: { level: "pre" } } });

  test("kata yang dihafal di perangkat lain tetap ada setelah menyimpan", async ({
    page,
    api,
  }) => {
    await openApp(page, "/vocab");
    // Meanwhile another device memorised a word (a newer version).
    api.server.known = { data: { "s:other-device": 1 }, version: 99_999 };

    await page
      .getByRole("button", { name: "Tandai hafal", exact: true })
      .first()
      .click();

    // The first save is refused (409), merged with the server copy and sent
    // again: both words survive.
    await expect.poll(() => api.conflicts).toContain("known");
    await expect
      .poll(() => Object.keys((api.server.known?.data as object) ?? {}), {
        timeout: 10_000,
      })
      .toEqual(
        expect.arrayContaining([
          "s:other-device",
          expect.stringMatching(/^1:w:/),
        ]),
      );
  });

  test("tab ditutup sebelum sempat menyimpan: dikirim saat dibuka lagi", async ({
    page,
    api,
  }) => {
    await openApp(page, "/vocab");
    // The save can't get through before the tab goes away.
    await page.route("**/api/v1/me/progress/known", (route) => route.abort());
    await page
      .getByRole("button", { name: "Tandai hafal", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: "✓ Hafal", exact: true }).first(),
    ).toBeVisible();
    await page.evaluate(() =>
      document.dispatchEvent(new Event("visibilitychange")),
    );
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("ge-progress-outbox-v1")),
      )
      .toContain("1:w:");
    expect(api.server.known).toBeUndefined();

    // Opened again (network back): the saved taps are sent.
    await page.unroute("**/api/v1/me/progress/known");
    await openApp(page, "/vocab");
    await expect
      .poll(() => Object.keys((api.server.known?.data as object) ?? {}), {
        timeout: 10_000,
      })
      .toContainEqual(expect.stringMatching(/^1:w:/));
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("ge-progress-outbox-v1")),
      )
      .toBeNull();
  });
});

test.describe("server tidak bisa dihubungi", () => {
  test.use({ mock: { sessionStatus: 503 } });

  test("tetap masuk: layar Tidak bisa terhubung dengan Coba lagi", async ({
    page,
  }) => {
    await page.goto("/plan");
    await expect(
      page.getByRole("heading", { name: "Tidak bisa terhubung" }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/plan/);
    await expect(page.getByRole("button", { name: "Coba lagi" })).toBeVisible();
  });
});
