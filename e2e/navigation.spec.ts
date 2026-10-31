import { expect, loadPackage, stat, test } from "./fixtures/test";

test("navigating between the main pages", async ({ page }) => {
  // The mobile and desktop layouts each render their own copy of the nav.
  const nav = (name: string) =>
    page
      .getByRole("link", { name, exact: true })
      .filter({ visible: true })
      .click();
  const link = (name: RegExp) =>
    page.getByRole("link", { name }).filter({ visible: true });

  await loadPackage(page);

  await nav("Stats");
  await expect(page).toHaveURL(/\/stats\/$/);
  await expect(page.getByText("104,805 messages sent")).toBeVisible();

  await nav("Top");
  await expect(page).toHaveURL(/\/top\/dms\/$/);
  await expect(link(/Pixel Otter/)).toBeVisible();
  await nav("Guilds");
  await expect(page).toHaveURL(/\/top\/guilds\/$/);
  await expect(link(/Synthwave Cafe/)).toBeVisible();
  await nav("Channels");
  await expect(page).toHaveURL(/\/top\/channels\/$/);
  await expect(link(/#general.*Synthwave Cafe/)).toBeVisible();
  await nav("DMs");

  await link(/Pixel Otter/).click();
  await expect(page).toHaveURL(/\/top\/dms\/details\/\?id=\d+&/);
  await expect(stat(page, "total messages sent")).toHaveText("8,199");
  // A details page links back to the list it was opened from.
  await page.locator('a[href*="#dm-"]').filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/top\/dms\/#dm-\d+$/);

  await nav("Overview");
  await page.locator('a[href^="/settings"]').filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/settings\//);
  await expect(stat(page, "Discord user")).toHaveText("nova.quill");
  // The back arrow on mobile, the logo on desktop.
  await page
    .locator('a[href^="/overview"]')
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/overview\/$/);
});
