import type { Page } from "@playwright/test";

import { acceptConfirm } from "./support/app";
import { expect, test } from "./support/fixtures";
import { adminSession } from "./support/mock-api";

// Admin › Token akses after the redesign: tabs, status marks, creating a
// token (shown once, copyable) and every row action reaching the API.

test.use({ mock: { session: adminSession } });

const openTokens = async (page: Page) => {
  await page.goto("/admin/tokens");
  await expect(page.getByText("Budi").first()).toBeVisible();
};

// The ⋯ menu of a token row, by its owner's name.
const rowAction = async (page: Page, owner: string, item: string) => {
  const row = page.locator("tr", { hasText: owner });
  await row.getByRole("button", { name: "Aksi token" }).click();
  await page.getByRole("menuitem", { name: item }).click();
};

test("tab admin dan status bertanda", async ({ page }) => {
  await openTokens(page);
  await expect(page.getByRole("link", { name: "Token akses" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("link", { name: "Kosakata" })).toBeVisible();
  for (const s of ["Aktif", "Nonaktif", "Kedaluwarsa"])
    await expect(page.getByText(s, { exact: true }).first()).toBeVisible();
});

test("buat token: tampil sekali dan bisa disalin", async ({
  page,
  context,
  api,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openTokens(page);
  await page.getByRole("button", { name: "+ Buat token" }).click();
  const dialog = page.getByRole("dialog", { name: "Token baru" });
  await dialog
    .getByRole("textbox", { name: /Nama \/ label pemilik/ })
    .fill("Rina");
  await dialog.getByRole("button", { name: "Buat token" }).click();
  await expect.poll(() => api.admin).toContain("POST /admin/tokens");
  await expect(page.getByText("ge_e2e_baru_123456")).toBeVisible();
  await page.getByRole("button", { name: "Salin token" }).click();
  await expect(page.getByRole("button", { name: "Tersalin ✓" })).toBeVisible();
});

// Actions that ask first (the app's confirm dialog).
const ASKS = new Set([
  "Nonaktifkan",
  "Reset perangkat",
  "Buat ulang token",
  "Hapus",
]);

const ACTIONS: [string, string, string][] = [
  ["Budi", "Nonaktifkan", "POST /admin/tokens/t0/revoke"],
  ["Sari", "Aktifkan", "POST /admin/tokens/t1/activate"],
  ["Budi", "Reset perangkat", "DELETE /admin/tokens/t0/sessions"],
  ["Budi", "Buat ulang token", "POST /admin/tokens/t0/regenerate"],
  ["Kelas Sabtu", "Hapus", "DELETE /admin/tokens/t2"],
];

for (const [owner, item, call] of ACTIONS) {
  test(`aksi baris: ${item}`, async ({ page, api }) => {
    await openTokens(page);
    await rowAction(page, owner, item);
    if (ASKS.has(item)) await acceptConfirm(page);
    await expect.poll(() => api.admin).toContain(call);
  });
}

test("ubah token lewat modal", async ({ page, api }) => {
  await openTokens(page);
  await rowAction(page, "Budi", "Ubah");
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Simpan" }).click();
  await expect.poll(() => api.admin).toContain("PATCH /admin/tokens/t0");
});

test("lihat progres token", async ({ page }) => {
  await openTokens(page);
  await rowAction(page, "Budi", "Lihat progres");
  await expect(page.getByText("86").first()).toBeVisible();
});
