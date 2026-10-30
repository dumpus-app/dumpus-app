import { RANGES } from "./fixtures/dataset";
import { compact, expectations, standard } from "./fixtures/expected";
import { PACKAGE_STATE, dataset, expect, test } from "./fixtures/test";

test.use({ storageState: PACKAGE_STATE });

// `SQL_DEFAULT_LIMIT` in `src/constants.tsx`
const PAGE_SIZE = 20;

for (const { id: range, label } of RANGES) {
  test(`overview, ${label}`, async ({ page, app }) => {
    const expected = expectations(dataset, range);

    await page.goto("/overview/");
    await app.selectRange(range);

    // `.first()`: the share image renders the name again, off-screen.
    await expect(
      page.getByText("Nova Quill", { exact: true }).first(),
    ).toBeVisible();
    await expect(app.stat("messages sent")).toHaveText(
      standard(expected.messagesSent),
    );
    await expect(app.stat("joined servers")).toHaveText(
      standard(expected.joinedServers),
    );
    await expect(app.stat("received calls")).toHaveText(
      standard(expected.receivedCalls),
    );
    await expect(app.stat("top hour")).toHaveText(expected.topHour);
    await expect(app.stat("known users")).toHaveText(
      standard(expected.knownUsers),
    );
    await expect(app.stat("Discord app started")).toHaveText(
      standard(expected.appStarted),
    );
    await expect(app.stat("average messages sent per day")).toHaveText(
      compact(expected.messagesPerDay),
    );
    await expect(app.stat("Discord app openings per day")).toHaveText(
      compact(expected.appOpeningsPerDay),
    );

    const dms = expected.topDMs.slice(0, PAGE_SIZE);
    await expect(page.locator('a[id^="dm-"]')).toHaveCount(dms.length);
    for (const dm of dms) {
      await expect(page.locator(`#dm-${dm.id}`)).toHaveText(
        `${dm.rank}. ${dm.name}${compact(dm.total)} messages`,
      );
    }

    const guilds = expected.topGuilds.slice(0, PAGE_SIZE);
    await expect(page.locator('a[id^="guild-"]')).toHaveCount(guilds.length);
    for (const guild of guilds) {
      const card = page.locator(`#guild-${guild.id}`);
      // Guilds the widget API knows show their icon, the others an initial.
      const known = dataset.widgets.has(guild.id);
      await expect(card).toHaveText(
        `${known ? "" : guild.name[0]}${guild.rank}. ${guild.name}${compact(guild.total)} messages`,
      );
      if (known) {
        await expect(card.getByRole("img")).toHaveAttribute(
          "alt",
          `${guild.name}'s avatar`,
        );
      }
    }

    const channels = expected.topChannels.slice(0, PAGE_SIZE);
    await expect(page.locator('a[id^="channel-"]')).toHaveCount(
      channels.length,
    );
    for (const channel of channels) {
      // The icon is the initial after the `#`.
      await expect(page.locator(`#channel-${channel.id}`)).toHaveText(
        `${channel.name[1]}${channel.rank}. ${channel.name}${compact(channel.total)} messages`,
      );
    }

    await app.charts(2);
    await app.screenshot(`overview-${range}`);
  });
}
