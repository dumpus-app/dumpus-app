import { readFile } from "node:fs/promises";
import { expect, loadPackage, test } from "./fixtures/test";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

test("the share popup makes the recap image", async ({ page }) => {
  // Without the Web Share API the popup offers a download, as in Firefox.
  await page.addInitScript(() => {
    delete (Navigator.prototype as Partial<Navigator>).share;
  });
  await loadPackage(page);

  await page
    .getByRole("button", { name: "Share", exact: true })
    .filter({ visible: true })
    .click();
  // Enabled once the image is ready.
  const download = page
    .getByRole("dialog")
    .getByRole("button", { name: "Download" });
  const [file] = await Promise.all([
    page.waitForEvent("download"),
    download.click(),
  ]);
  const png = await readFile(await file.path());
  expect(png.subarray(0, 8)).toEqual(PNG_SIGNATURE);
});
