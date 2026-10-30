import type { Page } from "@playwright/test";
import type { StatusError } from "./fixtures/api";
import { FAKE_PACKAGE_LINK, FAKE_UPN } from "./fixtures/dataset";
import { dataset, expect, test } from "./fixtures/test";

async function submitLink(page: Page, link: string) {
  await page.goto("/onboarding/access/link/");
  await page.getByLabel("Discord link").fill(link);
  await page.getByRole("button", { name: "Explore!" }).click();
  await expect(page).toHaveURL(/\/onboarding\/loading\/\?packageLink=/);
}

test("loading a package, from the queue to the overview", async ({
  page,
  app,
  api,
}) => {
  const releaseProcess = api.hold("process");
  await submitLink(page, FAKE_PACKAGE_LINK);
  await expect(
    page.getByRole("heading", { name: "We’re loading your data" }),
  ).toBeVisible();
  await app.screenshot("loading-process");

  api.step = "LOCKED";
  releaseProcess();
  await expect(
    page.getByRole("heading", { name: "You're in the queue!" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "3" })).toBeVisible();
  // 3 packages ahead, 2 minutes each.
  await expect(page.getByText("Estimated waiting time is 6m 0s")).toBeVisible();
  await app.screenshot("loading-queue");

  await app.openDialog(
    page.getByRole("button", { name: "Why is there a queue?" }),
  );
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/self-host our API server/)).toBeVisible();
  await app.screenshot("loading-queue-why", { fullPage: false });
  await dialog.getByRole("button", { name: "Got it!" }).click();
  await expect(dialog).toBeHidden();

  const current = page.locator(".animate-pulse.text-lg");
  for (const [step, label] of [
    ["DOWNLOADING", "Downloading"],
    ["ANALYZING", "Analyzing"],
  ] as const) {
    api.step = step;
    await expect(current).toHaveText(label);
    await app.screenshot(`loading-${step.toLowerCase()}`);
  }

  const releaseBlob = api.hold("blob");
  api.step = "PROCESSED";
  await expect(current).toHaveText("Processing");
  await app.screenshot("loading-processed");
  releaseBlob();

  await expect(page).toHaveURL(/\/overview\/$/);
  await expect(page.getByText("Sheer numbers")).toBeVisible();

  const bearer = `Bearer ${FAKE_UPN}`;
  expect(api.calls).toContainEqual({
    method: "POST",
    path: "/process",
    authorization: undefined,
  });
  expect(api.calls).toContainEqual({
    method: "GET",
    path: `/process/${dataset.packageId}/status`,
    authorization: bearer,
  });
  expect(api.calls).toContainEqual({
    method: "GET",
    path: `/process/${dataset.packageId}/blob`,
    authorization: bearer,
  });
});

const ERRORS: [code: StatusError, message: string][] = [
  ["INVALID_LINK", "Link invalid."],
  ["EXPIRED_LINK", "Link expired."],
  [
    "MISSING_USER_DATA",
    'Your Discord export is missing your User data. When requesting your data again, make sure the "User data" option is ticked.',
  ],
  ["UNKNOWN_ERROR", "An unknown error occurred."],
];

for (const [code, message] of ERRORS) {
  test(`loading error ${code}`, async ({ page, app, api }) => {
    if (code === "INVALID_LINK") {
      // The API refuses links it can't map to a package.
      await submitLink(page, "https://click.discord.com/ls/click?upn=unknown");
    } else {
      api.step = "DOWNLOADING";
      api.statusError = code;
      await submitLink(page, FAKE_PACKAGE_LINK);
    }

    await expect(
      page.getByRole("heading", { name: "An error occurred..." }),
    ).toBeVisible();
    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await app.screenshot(`loading-error-${code.toLowerCase()}`);

    await page.getByRole("link", { name: "Retry" }).click();
    await expect(page).toHaveURL(/\/onboarding\/access\/link\/$/);
  });
}
