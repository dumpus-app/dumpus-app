import { test as base, expect, type Page } from "@playwright/test";
import { FakeApi, type Package } from "./api";
import {
  FAKE_PACKAGE_LINK,
  buildDemoDataset,
  buildMainDataset,
  type Dataset,
} from "./dataset";
import { buildDatabase, packBlob } from "./sqlite";

export { expect };

let packages: Promise<Package[]> | undefined;

async function pack(dataset: Dataset): Promise<Package> {
  const { body, iv } = packBlob(await buildDatabase(dataset), dataset.upn);
  return { dataset, blob: body, iv };
}

// The browser logs each request that fails as a console error. These fail
// against the real API too, so they are the only console errors a test
// lets through.
const HARMLESS: { text: RegExp; url: RegExp; reason: string }[] = [
  {
    text: /status of 404\b/,
    url: /^https:\/\/api\.dumpus\.app\/widget\/\d+$/,
    reason: "The widget API answers 404 for a guild its bot isn't in.",
  },
  {
    text: /status of 500\b/,
    url: /^https:\/\/api\.dumpus\.app\/process\/[0-9a-f]{32}\/user\/\d+$/,
    reason: "The user lookup answers 500 for an account Discord can't find.",
  },
  {
    text: /status of 401\b/,
    url: /^https:\/\/api\.dumpus\.app\/process\/demo\/user\/\d+$/,
    reason: "The demo has no key, so the API refuses its user lookups.",
  },
];

export const test = base.extend<{ api: FakeApi }>({
  api: async ({ context }, use) => {
    packages ??= Promise.all([
      pack(buildMainDataset()),
      pack(buildDemoDataset()),
    ]);
    const api = new FakeApi(await packages);
    await api.install(context);
    await use(api);
    expect(api.unexpected, "requests to unmocked hosts").toEqual([]);
  },
  // Depends on `api` so the mocks are in place before the first navigation.
  page: async ({ page, api }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? `${error}`));
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text();
      const { url } = message.location();
      const harmless = HARMLESS.some(
        (line) => line.text.test(text) && line.url.test(url),
      );
      if (!harmless) errors.push(`${text} (${url})`);
    });
    await use(page);
    expect(errors, "page errors and console errors").toEqual([]);
  },
});

/** Loads the fake package through the link form, the way a user does. */
export async function loadPackage(page: Page) {
  await page.goto("/onboarding/access/link/");
  await page.getByLabel("Discord link").fill(FAKE_PACKAGE_LINK);
  await page.getByRole("button", { name: "Explore!" }).click();
  await expect(page).toHaveURL(/\/overview\/$/);
}

/** Value of the stat card labelled `label`. */
export function stat(page: Page, label: string) {
  return page
    .getByText(label, { exact: true })
    .filter({ visible: true })
    .locator("xpath=preceding-sibling::*[1]");
}
