import { RANGES } from "./fixtures/dataset";
import { compact, expectations } from "./fixtures/expected";
import { PACKAGE_STATE, dataset, expect, test } from "./fixtures/test";

test.use({ storageState: PACKAGE_STATE });

// `SQL_DEFAULT_LIMIT` in `src/constants.tsx`
const PAGE_SIZE = 20;

for (const { id: range, label } of RANGES) {
  test(`top DMs, ${label}`, async ({ page, app }) => {
    const { topDMs } = expectations(dataset, range);

    await page.goto("/top/dms/");
    await app.selectRange(range);

    const rows = page.locator('a[id^="dm-"]');
    await expect(rows).toHaveCount(Math.min(PAGE_SIZE, topDMs.length));
    for (const dm of topDMs.slice(0, PAGE_SIZE)) {
      // `..` is the row, with the rank next to the card.
      await expect(page.locator(`#dm-${dm.id}`).locator("..")).toHaveText(
        `#${dm.rank}${dm.name}${compact(dm.total)} messages sent`,
      );
    }
    await expect(page.getByRole("button", { name: "Load more" })).toBeVisible({
      visible: topDMs.length > PAGE_SIZE,
    });

    await app.screenshot(`top-dms-${range}`);
  });

  test(`top guilds, ${label}`, async ({ page, app }) => {
    const { topGuilds } = expectations(dataset, range);

    await page.goto("/top/guilds/");
    await app.selectRange(range);

    const rows = page.locator('a[href^="/top/guilds/details/"]');
    await expect(rows).toHaveCount(topGuilds.length);
    for (const guild of topGuilds) {
      const row = rows.nth(guild.rank - 1);
      // Guilds the widget API knows show their icon, the others an initial.
      const known = dataset.widgets.has(guild.id);
      await expect(row.locator("..")).toHaveText(
        `#${guild.rank}${known ? "" : guild.name[0]}${guild.name}${compact(guild.total)} messages sent`,
      );
      if (known) {
        await expect(row.getByRole("img")).toHaveAttribute(
          "alt",
          `${guild.name}'s avatar`,
        );
      }
    }

    await app.screenshot(`top-guilds-${range}`);
  });

  test(`top channels, ${label}`, async ({ page, app }) => {
    const { topChannels } = expectations(dataset, range);

    await page.goto("/top/channels/");
    await app.selectRange(range);

    const rows = page.locator('a[id^="channel-"]');
    await expect(rows).toHaveCount(Math.min(PAGE_SIZE, topChannels.length));
    for (const channel of topChannels.slice(0, PAGE_SIZE)) {
      await expect(
        page.locator(`#channel-${channel.id}`).locator(".."),
      ).toHaveText(
        `#${channel.rank}${channel.name[1]}${channel.name}${channel.guildName} · ${compact(channel.total)} messages sent`,
      );
    }

    await app.screenshot(`top-channels-${range}`);
  });
}

test("top DMs and channels load past the first page", async ({ page }) => {
  const { topDMs, topChannels } = expectations(dataset, "lifetime");
  expect(topDMs.length).toBeGreaterThan(PAGE_SIZE);
  expect(topChannels.length).toBeGreaterThan(PAGE_SIZE);

  await page.goto("/top/dms/");
  await expect(page.locator('a[id^="dm-"]')).toHaveCount(PAGE_SIZE);
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(page.locator('a[id^="dm-"]')).toHaveCount(topDMs.length);
  const last = topDMs[topDMs.length - 1];
  await expect(page.locator(`#dm-${last.id}`).locator("..")).toHaveText(
    `#${last.rank}${last.name}${compact(last.total)} messages sent`,
  );
  await expect(page.getByRole("button", { name: "Load more" })).toBeHidden();

  await page
    .getByRole("link", { name: "Channels", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/\/top\/channels\/$/);
  await expect(page.locator('a[id^="channel-"]')).toHaveCount(PAGE_SIZE);
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(page.locator('a[id^="channel-"]')).toHaveCount(
    topChannels.length,
  );
});
