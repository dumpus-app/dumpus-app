import { defineConfig } from "@playwright/test";

const PORT = 4789;

export default defineConfig({
  testDir: "e2e",
  // Only the `linux` baselines are committed, taken in the Playwright image
  // CI runs in (`pnpm test:e2e:docker`). Other platforms render fonts a bit
  // differently, so a first local run records its own baselines.
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{platform}/{projectName}/{testFilePath}/{arg}{ext}",
  updateSnapshots: process.env.CI ? "none" : "missing",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // A retry would hide exactly the flakiness this suite must not have.
  retries: 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      // The default 0.2 lets a whole palette step through, for eg. the stat
      // values going from `text-brand-300` to `text-brand-400` (0.16). Run to
      // run, scaled images still differ by up to 0.035 on their corners.
      threshold: 0.05,
    },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "en-US",
    timezoneId: "UTC",
    colorScheme: "dark",
    trace: "retain-on-failure",
    launchOptions: {
      // Anything that slips past the route mocks hits a dead proxy instead
      // of the real API.
      proxy: { server: "http://127.0.0.1:9", bypass: "localhost,127.0.0.1" },
      // On Linux, subpixel text bleeds a pixel past each glyph, and a
      // partial repaint after a client-side navigation sometimes leaves
      // that pixel of the previous page behind.
      args: ["--disable-lcd-text"],
    },
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "mobile",
      dependencies: ["setup"],
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "desktop",
      dependencies: ["setup"],
      use: {
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: {
    command: `pnpm exec serve dist --listen ${PORT} --no-port-switching --no-clipboard`,
    url: `http://localhost:${PORT}`,
    env: { NO_UPDATE_CHECK: "1" },
    // Fail on a busy port rather than test whatever app is listening there.
    reuseExistingServer: false,
  },
});
