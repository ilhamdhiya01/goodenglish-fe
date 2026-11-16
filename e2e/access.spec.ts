import { expect, test } from "./support/fixtures";

// The token screen: every refusal the backend can give has its own message
// under the field, an offline device is told before trying, and an empty
// field can't be sent.

test.use({ mock: { session: null } });

const ERRORS: [string, RegExp][] = [
  ["ge_salah", /Token tidak dikenal/],
  ["ge_revoked", /sudah dinonaktifkan/],
  ["ge_expired", /Masa berlaku token ini sudah habis/],
  ["ge_devices", /jumlah perangkat maksimal/],
];

test("kolom kosong: Masuk nonaktif", async ({ page }) => {
  await page.goto("/access");
  await expect(page.getByRole("button", { name: "Masuk" })).toBeDisabled();
});

for (const [token, msg] of ERRORS) {
  test(`pesan error untuk ${token}`, async ({ page }) => {
    await page.goto("/access");
    const field = page.getByRole("textbox", { name: "Token akses" });
    await field.fill(token);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page.getByText(msg)).toBeVisible();
    await expect(page.getByText(msg)).toContainText("✕");
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/access/);
  });
}

test("offline: diberi tahu sebelum mencoba", async ({ page, context }) => {
  await page.goto("/access");
  await context.setOffline(true);
  await expect(page.getByText(/Tidak bisa terhubung ke server/)).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText(/Tidak bisa terhubung ke server/)).toHaveCount(0);
});

test("token benar masuk, kembali ke halaman asal", async ({ page }) => {
  await page.goto("/review");
  await expect(page).toHaveURL(/\/access\?callbackUrl=%2Freview/);
  await page.getByRole("textbox", { name: "Token akses" }).fill("ge_e2e");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/review$/);
});
