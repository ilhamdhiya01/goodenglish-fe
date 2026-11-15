import { clickAccountAction, openApp } from "./support/app";
import { expect, test } from "./support/fixtures";
import { limitedSession } from "./support/mock-api";

// The page frame: every element of the old header / tabs / level cards /
// "Hari ini" bar is still reachable in at most two taps.

const MENUS = [
  "Rencana",
  "Kosakata",
  "Ulang",
  "Skenario",
  "Kesalahan umum",
  "Panduan grammar",
  "Pelafalan",
  "Cheat sheet",
];

const isPhone = (w: number) => w < 700;

test("delapan menu tercapai dan yang aktif ditandai", async ({ page }) => {
  await openApp(page, "/plan");
  const phone = isPhone(page.viewportSize()!.width);
  const nav = page.getByRole("navigation", { name: "Menu utama" });
  for (const name of MENUS) {
    const direct = nav.getByRole("link", { name: new RegExp(`^${name}`) });
    if (await direct.isVisible()) continue;
    expect(phone, `${name} tidak terlihat di navigasi`).toBe(true);
    await nav.getByRole("button", { name: "Lainnya" }).click();
    const sheet = page.getByRole("dialog", { name: "Lainnya" });
    await expect(sheet.getByRole("link", { name })).toBeVisible();
    await page.keyboard.press("Escape");
  }
  await expect(nav.getByRole("link", { name: /^Rencana/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("aksi akun ada di menu ⋯ atau lembar Lainnya", async ({ page }) => {
  await openApp(page, "/plan");
  const phone = isPhone(page.viewportSize()!.width);
  if (phone) {
    await page.getByRole("button", { name: "Lainnya" }).click();
    const sheet = page.getByRole("dialog", { name: "Lainnya" });
    for (const name of ["Ekspor progres", "Impor progres", "Keluar"]) {
      await expect(sheet.getByRole("button", { name })).toBeVisible();
    }
  } else {
    await page.getByRole("button", { name: "Menu akun" }).click();
    for (const name of ["Ekspor progres", "Impor progres", "Keluar"]) {
      await expect(page.getByRole("menuitem", { name })).toBeVisible();
    }
  }
});

test("pemilih level membuka keempat level dan mengganti level", async ({
  page,
}) => {
  await openApp(page, "/vocab");
  await page.getByRole("button", { name: /pilih level$/ }).click();
  const pemula = page
    .getByRole("menuitemradio", { name: /Pemula/ })
    .or(
      page
        .getByRole("dialog", { name: "Pilih level" })
        .getByRole("button", { name: /Pemula/ }),
    );
  await expect(pemula).toBeVisible();
  for (const name of [
    "Pre-intermediate",
    "Intermediate",
    "Upper-intermediate",
  ]) {
    await expect(page.getByText(name, { exact: true }).last()).toBeVisible();
  }
  await pemula.click();
  await expect(
    page.getByRole("button", { name: /^Pemula.*pilih level$/ }),
  ).toBeVisible();
});

test("baris Hari ini: tidak di Rencana, bisa disembunyikan untuk hari ini", async ({
  page,
}) => {
  await openApp(page, "/plan");
  await expect(page.getByText(/^Hari ini \d+\/\d+$/)).toHaveCount(0);
  await expect(
    page.getByText("Salah ucap itu bagian dari belajar. Terus bicara."),
  ).toBeVisible();

  await page.goto("/vocab");
  const line = page.getByText(/^Hari ini \d+\/\d+$/);
  await expect(line).toBeVisible();
  await page
    .getByRole("button", { name: "Sembunyikan untuk hari ini" })
    .click();
  await expect(line).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("MEMUAT…")).toHaveCount(0, { timeout: 15_000 });
  await expect(line).toHaveCount(0);
});

test("tombol kembali ke atas muncul setelah menggulir", async ({ page }) => {
  await openApp(page, "/vocab");
  // aria-hidden while invisible, so not found by role until it shows.
  const top = page.locator('button[aria-label="Kembali ke atas"]');
  await expect(top).toHaveCSS("opacity", "0");
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3));
  await expect(top).toHaveCSS("opacity", "1");
  await top.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(50);
});

test("Tanya AI: tombol di bar atas membuka panel, Esc menutupnya", async ({
  page,
}) => {
  await openApp(page, "/plan");
  await page.getByRole("button", { name: "Tanya AI" }).click();
  const panel = page.getByRole("dialog", { name: "Tanya AI" });
  await expect(panel).toBeVisible();
  // The panel still overlays the top bar until stage 9 makes it push the
  // page aside; then the same button will close it too.
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
});

test.describe("token terbatas", () => {
  test.use({ mock: { session: limitedSession } });

  test("semua menu muat tanpa Lainnya; aksi akun di menu ⋯", async ({
    page,
  }) => {
    await openApp(page, "/plan");
    const nav = page.getByRole("navigation", { name: "Menu utama" });
    await expect(nav.getByRole("link")).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Lainnya" })).toHaveCount(0);
    await clickAccountAction(page, "Impor progres");
    await expect(page.getByRole("button", { name: "Tanya AI" })).toHaveCount(0);
  });
});
