import { RANGES } from "./fixtures/dataset";
import {
  compact,
  duration,
  expectations,
  money,
  standard,
} from "./fixtures/expected";
import { PACKAGE_STATE, dataset, expect, test } from "./fixtures/test";

test.use({ storageState: PACKAGE_STATE });

const EXTRA_STATS: [label: string, event: string][] = [
  ["notifications clicked", "notification_clicked"],
  ["captcha completed", "captcha_served"],
  ["emails received", "email_opened"],
  ["logins successful", "login_successful"],
  ["avatar updates", "user_avatar_updated"],
  ["crashes", "app_crashed"],
  ["oauth2 authorized", "oauth2_authorize_accepted"],
  ["voice messages recorded", "voice_message_recorded"],
  ["messages reported", "message_reported"],
  ["messages edited", "message_edited"],
  ["seen nitro ads", "premium_upsell_viewed"],
];

for (const { id: range, label } of RANGES) {
  test(`stats, ${label}`, async ({ page, app }) => {
    const expected = expectations(dataset, range);

    await page.goto("/stats/");
    await app.selectRange(range);

    const cards: [title: string, description: string][] = [
      [
        `${standard(expected.messagesSent)} messages sent`,
        `That's about ${expected.messagesPerDay} messages per day!`,
      ],
      [
        `${compact(expected.joinedServers)} joined servers`,
        "We've got a real Discord server explorer!",
      ],
      [
        `${compact(expected.knownUsers)} known users`,
        "Well, you know a lot of people!",
      ],
      [`${money(expected.spentMoney)} spent`, "That's a lot of cash...!"],
      [
        `${standard(expected.appStarted)} app starts`,
        `You open Discord about ${expected.appOpeningsPerDay} times per day!`,
      ],
      [
        `${duration(expected.avgSessionMinutes * 60_000)} avg. session time`,
        `You spent about ${duration(expected.totalSessionMinutes * 60_000, true)} on Discord`,
      ],
    ];
    for (const [title, description] of cards) {
      await expect(
        page.getByText(title, { exact: true }).locator(".."),
      ).toHaveText(`${title}${description}`);
    }

    await expect(app.stat("average messages sent per day")).toHaveText(
      compact(expected.messagesPerDay),
    );
    for (const [label, event] of EXTRA_STATS) {
      await expect(app.stat(label)).toHaveText(standard(expected.event(event)));
    }
    await expect(app.stat("spent in voice channels")).toHaveText(
      duration(expected.voiceMinutes * 60_000),
    );

    await app.charts(2);
    await app.screenshot(`stats-${range}`);
  });
}
