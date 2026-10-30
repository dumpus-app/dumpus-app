import { expectations } from "./fixtures/expected";
import { PACKAGE_STATE, dataset, expect, test } from "./fixtures/test";

test.use({ storageState: PACKAGE_STATE });

test("navigating between pages", async ({ page }) => {
  const [dm] = expectations(dataset, "lifetime").topDMs;
  // The mobile and desktop layouts each render their own copy of the links.
  const link = (name: string) =>
    page.getByRole("link", { name, exact: true }).filter({ visible: true });

  await page.goto("/");
  await expect(page).toHaveURL(/\/overview\/$/);

  const sections: [title: string, url: RegExp][] = [
    ["Sheer numbers", /\/stats\/$/],
    ["Most active DMs", /\/top\/dms\/$/],
    ["Most active servers", /\/top\/guilds\/$/],
    ["Most active channels", /\/top\/channels\/$/],
    ["Your Discord hours", /\/stats\/#sending-times$/],
    ["Activity over time", /\/stats\/#activity-time$/],
  ];
  for (const [title, url] of sections) {
    await page
      .locator("section", { hasText: title })
      .getByRole("link", { name: "More" })
      .click();
    await expect(page).toHaveURL(url);
    await link("Overview").click();
    await expect(page).toHaveURL(/\/overview\/$/);
  }

  await link("Top").click();
  await expect(page).toHaveURL(/\/top\/dms\/$/);
  await link("Guilds").click();
  await expect(page).toHaveURL(/\/top\/guilds\/$/);
  await link("Channels").click();
  await expect(page).toHaveURL(/\/top\/channels\/$/);
  await link("DMs").click();
  await expect(page).toHaveURL(/\/top\/dms\/$/);
  await link("Stats").click();
  await expect(page).toHaveURL(/\/stats\/$/);
  await link("Overview").click();

  // A details page links back to where it was opened from.
  await page.locator(`#dm-${dm.id}`).click();
  await expect(page).toHaveURL(new RegExp(`/top/dms/details/\\?id=${dm.id}&`));
  await page
    .locator(`a[href*="#dm-${dm.id}"]`)
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/overview/#dm-${dm.id}$`));

  await page.locator('a[href^="/settings"]').filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/settings\//);
  // The back arrow on mobile, the logo on desktop.
  await page
    .locator('a[href^="/overview"]')
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/overview\/$/);
});
