import { FAKE_PACKAGE_LINK, FAKE_UPN } from "./fixtures/dataset";
import { PACKAGE_STATE, dataset, expect, test } from "./fixtures/test";

// Loads the fake package once through the link form, the way a user does,
// and saves the browser storage for the specs that start on a loaded app.
test("load the fake package", async ({ page, api }) => {
  await page.goto("/onboarding/access/link/");
  await page.getByLabel("Discord link").fill(FAKE_PACKAGE_LINK);
  await page.getByRole("button", { name: "Explore!" }).click();

  await expect(page).toHaveURL(/\/overview\/$/);
  await expect(page.getByText("Sheer numbers")).toBeVisible();
  expect(api.calls).toContainEqual({
    method: "GET",
    path: `/process/${dataset.packageId}/blob`,
    authorization: `Bearer ${FAKE_UPN}`,
  });

  await page.context().storageState({ path: PACKAGE_STATE });
});
