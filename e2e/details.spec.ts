import { RANGES, type RangeID } from "./fixtures/dataset";
import { compact, expectations, standard } from "./fixtures/expected";
import { PACKAGE_STATE, dataset, expect, test } from "./fixtures/test";

test.use({ storageState: PACKAGE_STATE });

// One DM, guild and channel per time range, each opened from its top list.
// Between them they cover:
// - DMs the user API knows, and one it doesn't (`onyx.puffin`)
// - guilds with or without a widget icon, with one bot or several
// - a guild joined inside the range (`Retro Arcade Club`)
const PICKS: Record<
  RangeID,
  { dm: string; guild: string; channel: [name: string, guild: string] }
> = {
  "4weeks": {
    dm: "Tidal Sprout",
    guild: "Retro Arcade Club",
    channel: ["#high-scores", "Retro Arcade Club"],
  },
  "6months": {
    dm: "onyx.puffin",
    guild: "Board Game Night",
    channel: ["#now-reading", "Book Nook"],
  },
  year: {
    dm: "Moss Kettle",
    guild: "Pixel Garden",
    channel: ["#help", "Rust Learners"],
  },
  lifetime: {
    dm: "Pixel Otter",
    guild: "Synthwave Cafe",
    channel: ["#general", "Synthwave Cafe"],
  },
};

for (const { id: range, label } of RANGES) {
  const picks = PICKS[range];

  test(`DM details, ${label}`, async ({ page, app }) => {
    const expected = expectations(dataset, range);
    const dm = expected.topDMs.find(({ name }) => name === picks.dm)!;
    const stats = expected.dm(dm.id);

    await page.goto("/top/dms/");
    await app.selectRange(range);
    await page.locator(`#dm-${dm.id}`).click();
    await expect(page).toHaveURL(
      new RegExp(`/top/dms/details/\\?id=${dm.id}&`),
    );

    await expect(
      page
        .getByText(dm.name, { exact: true })
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    await expect(app.stat("total messages sent")).toHaveText(
      standard(stats.messages),
    );
    await expect(app.stat("top chat hour")).toHaveText(stats.topHour);
    await expect(app.stat("reactions added")).toHaveText(
      standard(stats.reactions),
    );
    await expect(
      page.getByLabel(`Active with score: ${stats.sentiment}`),
    ).toHaveText(stats.sentiment.toFixed(3));

    await app.charts(1);
    await app.screenshot(`dm-${range}`);
  });

  test(`guild details, ${label}`, async ({ page, app }) => {
    const expected = expectations(dataset, range);
    const guild = expected.topGuilds.find(({ name }) => name === picks.guild)!;
    const stats = expected.guild(guild.id);
    const widget = dataset.widgets.get(guild.id);

    await page.goto("/top/guilds/");
    await app.selectRange(range);
    await page
      .locator('a[href^="/top/guilds/details/"]')
      .filter({ hasText: guild.name })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`/top/guilds/details/\\?id=${guild.id}&`),
    );

    await expect(
      page.getByText(`${widget?.member_count ?? "N/A"} members`, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(app.stat("total messages sent")).toHaveText(
      standard(stats.messages),
    );
    await expect(app.stat("guild joins")).toHaveText(standard(stats.joins));
    await expect(app.stat("top chat hour")).toHaveText(stats.topHour);

    const bots = page.locator("section", { hasText: "Top used bots" });
    for (const bot of stats.bots.slice(0, 4)) {
      await expect(bots.getByText(`${bot.total} commands`)).toBeVisible();
      await expect(bots.getByText(bot.name!, { exact: true })).toBeVisible();
    }
    await expect(bots).toHaveCount(stats.bots.length ? 1 : 0);

    const channels = page
      .locator("section", { hasText: "Top channels" })
      .getByRole("link");
    // Each icon is the channel's initial, after the `#`.
    await expect(channels).toHaveText(
      stats.channels.map(
        (channel, i) =>
          `${channel.name[1]}${i + 1}. ${channel.name}${compact(channel.total)} messages`,
      ),
    );

    await app.charts(1);
    await app.screenshot(`guild-${range}`);
  });

  test(`channel details, ${label}`, async ({ page, app }) => {
    const expected = expectations(dataset, range);
    const channel = expected.topChannels.find(
      ({ name, guildName }) =>
        name === picks.channel[0] && guildName === picks.channel[1],
    )!;
    const stats = expected.channel(channel.id);

    await page.goto("/top/channels/");
    await app.selectRange(range);
    await page.locator(`#channel-${channel.id}`).click();
    await expect(page).toHaveURL(
      new RegExp(`/top/channels/details/\\?id=${channel.id}&`),
    );

    await expect(
      page.locator("section", { hasText: "Related guild" }).getByRole("link"),
    ).toHaveText(
      `${channel.guildName[0]}${channel.guildName}${compact(stats.guildMessages)} messages sent`,
    );
    await expect(app.stat("total messages sent")).toHaveText(
      standard(stats.messages),
    );
    await expect(app.stat("top chat hour")).toHaveText(stats.topHour);
    await expect(app.stat("reactions added")).toHaveText(
      standard(stats.reactions),
    );
    // Not implemented in the app yet.
    await expect(app.stat("channel openings")).toHaveText("N/A");

    await app.charts(1);
    await app.screenshot(`channel-${range}`);
  });
}

test("details without activity in the time range", async ({ page, app }) => {
  const lifetime = expectations(dataset, "lifetime");
  const recent = expectations(dataset, "4weeks");
  const dm = lifetime.topDMs.find(({ name }) => name === "Moss Kettle")!;
  const guild = lifetime.topGuilds.find(
    ({ name }) => name === "Cloud Watchers",
  )!;
  const channel = lifetime.topChannels.find(({ name }) => name === "#photos")!;
  expect(recent.dm(dm.id).hasData).toBe(false);
  expect(recent.guild(guild.id).hasData).toBe(false);
  expect(recent.channel(channel.id).hasData).toBe(false);

  for (const [list, row] of [
    ["/top/dms/", page.locator(`#dm-${dm.id}`)],
    ["/top/guilds/", page.locator(`a[href*="?id=${guild.id}&"]`)],
    ["/top/channels/", page.locator(`#channel-${channel.id}`)],
  ] as const) {
    await page.goto(list);
    await app.selectRange("lifetime");
    await row.click();
    await expect(page.getByText("total messages sent")).toBeVisible();
    await app.selectRange("4weeks");
    await expect(page.getByText("No data available")).toBeVisible();
    await expect(
      page.getByText("Select another time range to view data"),
    ).toBeVisible();
  }
  await app.screenshot("channel-without-data");
});

// The loading screen redirects to `usePathname()`, which drops `?id=`, so a
// details page opened or reloaded from its URL shows "Not found".
test("details page opened from its URL", async ({ page, app }) => {
  const [dm] = expectations(dataset, "lifetime").topDMs;

  await page.goto(`/top/dms/details/?id=${dm.id}`);
  await expect(page.getByText("Not found", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/top\/dms\/details\/$/);
  await app.screenshot("dm-not-found");
});
