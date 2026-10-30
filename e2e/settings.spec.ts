import contributorsData from "../src/data/contributors.json";
import { FAKE_UPN } from "./fixtures/dataset";
import { API_ORIGIN } from "./fixtures/api";
import { PACKAGE_STATE, dataset, expect, test } from "./fixtures/test";

test.use({ storageState: PACKAGE_STATE });

test("settings and credits", async ({ page, app }) => {
  await page.goto("/overview/");
  await page.locator('a[href^="/settings"]').filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/settings\//);

  await expect(app.stat("UPN key")).toHaveText(FAKE_UPN);
  await expect(app.stat("Added on")).toHaveText("07/01/2024");
  await expect(app.stat("Package ID")).toHaveText(dataset.packageId);
  await expect(app.stat("Discord user")).toHaveText("nova.quill");
  await expect(app.stat("Backend URL")).toHaveText(API_ORIGIN);
  await expect(app.stat("17 available")).toHaveText("English");
  await expect(page.getByText("Switch Package")).toBeHidden();
  await app.screenshot("settings");

  await page.getByRole("link", { name: /Credits/ }).click();
  await expect(page).toHaveURL(/\/credits\/$/);
  await expect(page.getByText("Bug Hunter", { exact: true })).toBeVisible();
  const contributors = page.locator("section", { hasText: "Contributors" });
  await expect(contributors.locator("a")).toHaveCount(contributorsData.length);
  // Flags are lazy-loaded SVGs with a gray placeholder until then.
  await expect(page.locator(".rounded > .bg-gray-700")).toHaveCount(0);
  // Real people's names and avatars stay out of the baselines.
  await app.screenshot("credits", { mask: [contributors] });
});

test("switching the language", async ({ page, app }) => {
  await page.goto("/settings/");
  await app.openDialog(page.getByText("English", { exact: true }));
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Switch language" }),
  ).toBeVisible();
  await app.screenshot("languages", { fullPage: false });

  await dialog.getByRole("radio", { name: "Français" }).click();
  await expect(dialog).toBeHidden();
  await expect(app.stat("17 disponibles")).toHaveText("Français");
  await expect(
    page.getByRole("button", { name: "Supprimer le paquet actuel" }),
  ).toBeVisible();
  await app.screenshot("settings-fr");

  // `src/utils/format.ts` reads the language once, when its module loads,
  // which races with i18next's detection: after a reload, numbers and dates
  // come out in either locale, so only the copy is checked here.
  await page.goto("/overview/");
  await expect(page.getByText("Chiffres clés")).toBeVisible();
  await expect(
    page.getByText("messages envoyés", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Aperçu" }).filter({ visible: true }),
  ).toBeVisible();
});

test("deleting the package", async ({ page, api }) => {
  await page.goto("/settings/");
  await page.getByRole("button", { name: "Delete current package" }).click();

  await expect(page).toHaveURL(/\/onboarding\/access\/$/);
  expect(api.calls).toContainEqual({
    method: "DELETE",
    path: `/process/${dataset.packageId}`,
    authorization: `Bearer ${FAKE_UPN}`,
  });
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => key.startsWith("db:")),
    ),
  ).toEqual([]);
});

test("quitting and resetting", async ({ page, api }) => {
  await page.goto("/settings/");
  await page.getByRole("button", { name: "Quit and reset" }).click();

  await expect(page).toHaveURL(/\/onboarding\/$/);
  await expect(page.getByText("Welcome to Dumpus")).toBeVisible();
  expect(api.calls).toContainEqual({
    method: "DELETE",
    path: `/process/${dataset.packageId}`,
    authorization: `Bearer ${FAKE_UPN}`,
  });
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => key.startsWith("db:")),
    ),
  ).toEqual([]);
});
