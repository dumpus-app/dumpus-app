import { FAKE_PACKAGE_LINK } from "./fixtures/dataset";
import { expect, stat, test } from "./fixtures/test";

test("onboarding, from the welcome screen to the overview", async ({
  page,
  api,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding\/$/);
  for (const name of [
    "Let's go",
    "Got it!",
    "Awesome!",
    "Let's get my package!",
    "Got it!",
  ]) {
    await page.getByRole("link", { name, exact: true }).click();
  }
  await expect(page).toHaveURL(/\/onboarding\/access\/$/);
  await page.getByRole("link", { name: /Method 1/ }).click();

  api.step = "LOCKED";
  await page.getByLabel("Discord link").fill(FAKE_PACKAGE_LINK);
  await page.getByRole("button", { name: "Explore!" }).click();
  await expect(
    page.getByRole("heading", { name: "You're in the queue!" }),
  ).toBeVisible();

  api.step = "PROCESSED";
  await expect(page).toHaveURL(/\/overview\/$/);
  // The lifetime totals of the package in `fixtures/dataset.ts`.
  await expect(stat(page, "messages sent")).toHaveText("104,805");
  await expect(stat(page, "joined servers")).toHaveText("8");
  await expect(stat(page, "received calls")).toHaveText("70");
  await expect(stat(page, "top hour")).toHaveText("10 PM");
  await expect(stat(page, "known users")).toHaveText("28");
  await expect(stat(page, "Discord app started")).toHaveText("4,802");
});
