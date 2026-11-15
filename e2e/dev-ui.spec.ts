import { expect, test } from "./support/fixtures";

// The primitive gallery (/dev/ui): keyboard behavior of the overlays.

test.beforeEach(async ({ page }) => {
  await page.goto("/dev/ui");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("modal: fokus terkunci, Esc menutup dan mengembalikan fokus", async ({
  page,
}) => {
  const open = page.getByRole("button", { name: "Buka modal" });
  await open.click();
  const dialog = page.getByRole("dialog", { name: "Contoh modal" });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    await expect(dialog.locator(":focus")).toHaveCount(1);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
});

test("lembar: Esc menutup", async ({ page }) => {
  await page.getByRole("button", { name: "Buka lembar" }).click();
  const sheet = page.getByRole("dialog", { name: "Lainnya" });
  await expect(sheet).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(sheet.locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
});

test("menu: panah, Enter memilih, Esc mengembalikan fokus", async ({
  page,
}) => {
  const trigger = page.getByRole("button", { name: "Menu akun" });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("menuitem", { name: "Ekspor progres" }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Dipilih: Impor")).toBeVisible();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("cincin fokus terlihat saat Tab", async ({ page }) => {
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(
    () => getComputedStyle(document.activeElement!).outlineStyle,
  );
  expect(outline).toBe("solid");
});
