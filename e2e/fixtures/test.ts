import {
  test as base,
  expect,
  type Locator,
  type Page,
} from "@playwright/test";
import path from "node:path";
import { FakeApi, type Package } from "./api";
import {
  NOW,
  RANGES,
  buildDemoDataset,
  buildMainDataset,
  type Dataset,
  type RangeID,
} from "./dataset";
import { buildDatabase, packBlob } from "./sqlite";

export { expect };

/** Browser storage right after the fake package was loaded, see `package.setup.ts`. */
export const PACKAGE_STATE = path.join(__dirname, "../.state/package.json");

export const dataset = buildMainDataset();
export const demoDataset = buildDemoDataset();

let packages: Promise<Package[]> | undefined;

async function pack(dataset: Dataset): Promise<Package> {
  const { body, iv } = packBlob(await buildDatabase(dataset), dataset.upn);
  return { dataset, blob: body, iv };
}

/** Runs in the page, before the app. */
function pinTimeAndRandom({ now, seed }: { now: number; seed: number }) {
  // `page.clock.setFixedTime()` would also freeze the timestamps handed to
  // `requestAnimationFrame`, and recharts would never finish drawing.
  const RealDate = Date;
  function FixedDate(this: unknown, ...args: unknown[]) {
    if (!new.target) return new RealDate(now).toString();
    return args.length
      ? new RealDate(...(args as [number]))
      : new RealDate(now);
  }
  FixedDate.prototype = RealDate.prototype;
  FixedDate.now = () => now;
  FixedDate.parse = RealDate.parse;
  FixedDate.UTC = RealDate.UTC;
  window.Date = FixedDate as unknown as DateConstructor;

  // The chart modules shuffle their palette with `Math.random()` when they
  // load, and that shuffle also reorders the guild and channel icon colors.
  // This is `mulberry32()` from `dataset.ts`, inlined to run in the page.
  let a = seed;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const test = base.extend<{ api: FakeApi; app: App }>({
  api: async ({ context }, use) => {
    packages ??= Promise.all([pack(dataset), pack(demoDataset)]);
    const api = new FakeApi(await packages);
    await api.install(context);
    await use(api);
    api.releaseAll();
    expect(api.unexpected, "requests to unmocked hosts").toEqual([]);
  },
  // Depends on `api` so the mocks are in place before the first navigation.
  page: async ({ page, api }, use) => {
    await page.addInitScript(pinTimeAndRandom, {
      now: Date.parse(NOW),
      seed: 1,
    });
    await use(page);
  },
  app: async ({ page }, use) => {
    await use(new App(page));
  },
});

const VERSION = /^v\d+\.\d+\.\d+-\w+ \(\w+\)$/;

export class App {
  constructor(readonly page: Page) {}

  async selectRange(range: RangeID) {
    const { label } = RANGES.find(({ id }) => id === range)!;
    const button = this.page
      .getByRole("button", { name: label, exact: true })
      .filter({ visible: true });
    await button.click();
    await expect(button).toHaveClass(/text-brand-300/);
  }

  /** Value of the stat card labelled `label`. */
  stat(label: string) {
    return this.page
      .getByText(label, { exact: true })
      .filter({ visible: true })
      .locator("xpath=preceding-sibling::*[1]");
  }

  /** Waits for the page's `count` charts to finish drawing. */
  async charts(count: number) {
    const charts = this.page.locator(".recharts-wrapper");
    await expect(charts).toHaveCount(count);
    // Bars and lines animate for 300ms once the data or the size changes.
    let previous = "";
    await expect
      .poll(
        async () => {
          const current = await charts.evaluateAll((nodes) =>
            nodes.map((node) => node.innerHTML).join(),
          );
          const settled = current === previous;
          previous = current;
          return settled;
        },
        { intervals: [400] },
      )
      .toBe(true);
  }

  /**
   * Opens a dialog with the page behind it scrolled to the top. Clicking
   * scrolls to the trigger, smoothly in this app, and the page behind a
   * dialog opening mid-scroll stays at a random offset.
   */
  async openDialog(trigger: Locator) {
    await this.page.evaluate(() =>
      window.scrollTo({ top: 0, behavior: "instant" }),
    );
    await trigger.dispatchEvent("click");
  }

  /**
   * Screenshots the whole page by growing the viewport to the page height
   * (`fullPage` would leave the fixed bottom nav in the middle of the page),
   * or only the viewport with `{ fullPage: false }`, for dialogs.
   */
  async screenshot(
    name: string,
    {
      fullPage = true,
      mask = [],
    }: { fullPage?: boolean; mask?: Locator[] } = {},
  ) {
    const { page } = this;
    const viewport = page.viewportSize()!;
    await page.mouse.move(0, 0);
    await page.evaluate(async () => {
      await document.fonts.ready;
      const images = Array.from(document.images);
      // Lazy images below the fold would never load otherwise.
      for (const image of images) image.loading = "eager";
      await Promise.all(images.map((image) => image.decode().catch(() => {})));
    });
    if (fullPage) {
      const height = await page.evaluate(
        () => document.documentElement.scrollHeight,
      );
      await page.setViewportSize({
        width: viewport.width,
        height: Math.max(height, viewport.height),
      });
    }
    await expect(page).toHaveScreenshot(`${name}.png`, {
      // The version changes with every release.
      mask: [page.getByText(VERSION), ...mask],
    });
    await page.setViewportSize(viewport);
  }
}
