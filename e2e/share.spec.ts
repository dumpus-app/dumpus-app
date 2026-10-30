import { readFile } from "node:fs/promises";
import { PACKAGE_STATE, expect, test } from "./fixtures/test";

test.use({ storageState: PACKAGE_STATE });

test("share popup generates and downloads the recap image", async ({
  page,
  app,
}) => {
  // Without the Web Share API the popup offers a download, as in Firefox.
  await page.addInitScript(() => {
    delete (Navigator.prototype as Partial<Navigator>).share;
  });

  await page.goto("/overview/");
  await app.charts(2);
  await app.openDialog(
    page
      .getByRole("button", { name: "Share", exact: true })
      .filter({ visible: true }),
  );

  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Share your recap" }),
  ).toBeVisible();
  // `alt=""` makes it presentational, so no `img` role.
  await expect(dialog.locator("img")).toHaveAttribute(
    "src",
    /^data:image\/png;base64,/,
  );
  const download = dialog.getByRole("button", { name: "Download" });
  await expect(download).toBeEnabled();
  await app.screenshot("share-popup", { fullPage: false });

  const [file] = await Promise.all([
    page.waitForEvent("download"),
    download.click(),
  ]);
  expect(file.suggestedFilename()).toBe("dumpus-share.png");
  const png = await readFile(await file.path());
  // PNG signature, then the IHDR width and height: the 1200x775 card.
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 775]);
});
