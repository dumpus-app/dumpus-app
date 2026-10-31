import { expectations, standard } from "./fixtures/expected";
import { PACKAGE_STATE, demoDataset, expect, test } from "./fixtures/test";

test("demo, from onboarding to exit", async ({ page, app, api }) => {
  const expected = expectations(demoDataset, "lifetime");

  await page.goto("/onboarding/access/");
  const releaseBlob = api.hold("blob");
  await page.getByRole("link", { name: /No package yet/ }).click();
  await expect(
    page.getByRole("heading", { name: "We’re loading the demo" }),
  ).toBeVisible();
  await app.screenshot("demo-loading");
  releaseBlob();

  await expect(page).toHaveURL(/\/overview\/$/);
  const exit = page.getByRole("button", { name: "Exit demo and get started!" });
  await expect(exit).toBeVisible();
  await expect(page.getByText("Wumpus", { exact: true }).first()).toBeVisible();
  await expect(app.stat("messages sent")).toHaveText(
    standard(expected.messagesSent),
  );
  await app.charts(2);
  await app.screenshot("demo-overview");
  // The demo has no key: the app sends `demo` as bearer, which the API
  // doesn't check for the blob and refuses for user lookups.
  expect(api.calls).toContainEqual({
    method: "GET",
    path: "/process/demo/blob",
    authorization: "Bearer demo",
  });

  await exit.click();
  await expect(page).toHaveURL(/\/onboarding\/access\/$/);
  expect(api.calls.filter(({ method }) => method === "DELETE")).toEqual([]);
});

test.describe(() => {
  test.use({ storageState: PACKAGE_STATE });

  test("adding the demo next to a package and switching back", async ({
    page,
    app,
  }) => {
    await page.goto("/settings/");
    await page.getByRole("link", { name: "Add a new package" }).click();
    await expect(page).toHaveURL(/\/onboarding\/access\/$/);
    await page.getByRole("link", { name: /No package yet/ }).click();
    await expect(page).toHaveURL(/\/overview\/$/);
    await expect(
      page.getByText("Wumpus", { exact: true }).first(),
    ).toBeVisible();

    await page.goto("/settings/");
    await expect(app.stat("Discord user")).toHaveText("wumpus");
    const other = page.locator("a", { hasText: "nova.quill" });
    await expect(other.locator("..")).toHaveText(
      "#1nova.quillGenerated on 07/01/2024",
    );
    await app.screenshot("settings-two-packages");

    await other.click();
    await expect(page).toHaveURL(/\/overview\/$/);
    await expect(
      page.getByText("Nova Quill", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Exit demo and get started!" }),
    ).toBeHidden();
  });
});
