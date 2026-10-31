import { defineConfig } from "@playwright/test";

const PORT = 4789;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // A retry would hide exactly the flakiness this suite must not have.
  retries: 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "en-US",
    // The app turns the package's first and last days into local dates, so
    // the totals the tests expect change with the time zone.
    timezoneId: "UTC",
    trace: "retain-on-failure",
    launchOptions: {
      // Anything that slips past the route mocks hits a dead proxy instead
      // of the real API.
      proxy: { server: "http://127.0.0.1:9", bypass: "localhost,127.0.0.1" },
    },
  },
  projects: [
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "desktop",
      use: { viewport: { width: 1280, height: 800 } },
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
