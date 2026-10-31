import { expect, test } from "./fixtures/test";

test("onboarding, from the welcome screen to the link form", async ({
  page,
  app,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding\/$/);
  await expect(
    page.getByRole("heading", { name: "Welcome to Dumpus" }),
  ).toBeVisible();
  await expect(page.getByText("Select your favorite language")).toBeVisible();
  await app.screenshot("welcome");

  const next = (name: string) =>
    page.getByRole("link", { name, exact: true }).click();

  await next("Let's go");
  await expect(page).toHaveURL(/\/onboarding\/intro\/1\/$/);
  await expect(
    page.getByRole("heading", { name: "How does Dumpus work?" }),
  ).toBeVisible();
  await app.screenshot("intro-1");

  await next("Got it!");
  await expect(
    page.getByRole("heading", { name: "Can I trust Dumpus?" }),
  ).toBeVisible();
  await app.screenshot("intro-2");

  await next("Awesome!");
  await expect(
    page.getByRole("heading", { name: "Share it with your friends!" }),
  ).toBeVisible();
  await app.screenshot("intro-3");

  await next("Let's get my package!");
  await expect(page).toHaveURL(/\/onboarding\/setup\/$/);
  // The web build opens the desktop instructions first.
  await expect(page.getByRole("tab", { name: "Desktop" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.getByRole("img", { name: "Open your Discord settings" }),
  ).toHaveAttribute("src", /\/assets\/onboarding\/en\/desktop\/settings\.png$/);
  await app.screenshot("setup-desktop");
  for (const os of ["Android", "iOS"]) {
    await page.getByRole("tab", { name: os }).click();
    await expect(
      page.getByRole("img", { name: "Open your Discord settings" }),
    ).toHaveAttribute(
      "src",
      new RegExp(`/assets/onboarding/en/${os.toLowerCase()}/settings\\.png$`),
    );
    await app.screenshot(`setup-${os.toLowerCase()}`);
  }

  await next("Got it!");
  await expect(page).toHaveURL(/\/onboarding\/access\/$/);
  await expect(page.getByRole("link", { name: /Method 1/ })).toHaveText(
    "Enter your Discord linkMethod 1",
  );
  await expect(page.getByRole("link", { name: /Method 2/ })).toHaveText(
    "Transfer the email (soon)Method 2",
  );
  await expect(page.getByRole("link", { name: /No package yet/ })).toHaveText(
    "DemoNo package yet?",
  );
  await app.screenshot("access");

  await app.openDialog(
    page.getByRole("button", { name: "Why should I trust the app?" }),
  );
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/100% open source/)).toBeVisible();
  await app.screenshot("access-trust", { fullPage: false });
  await dialog.getByRole("button", { name: "Got it!" }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("link", { name: /Method 2/ }).click();
  await expect(page).toHaveURL(/\/onboarding\/access\/email\/$/);
  await expect(page.getByText("process@dumpus.app")).toBeVisible();
  await app.screenshot("access-email");
  await page.getByRole("link", { name: "Previous" }).click();

  await page.getByRole("link", { name: /Method 1/ }).click();
  await expect(page).toHaveURL(/\/onboarding\/access\/link\/$/);
  await app.screenshot("access-link");

  const link = page.getByLabel("Discord link");
  const explore = page.getByRole("button", { name: "Explore!" });
  const error = page.locator('[id$="-form-item-message"]');
  await explore.click();
  await expect(error).toHaveText("Invalid URL");
  await link.fill("https://discord.com/channels/@me");
  await explore.click();
  await expect(error).toHaveText(
    "Link must start with https://click.discord.com/ls/click?upn=",
  );
  await link.fill("https://click.discord.com/ls/click?upn=");
  await explore.click();
  await expect(error).toHaveText("UPN key can't be empty");
  await page.getByRole("button", { name: "Advanced" }).click();
  await expect(page.getByLabel("Backend URL (optional)")).toBeVisible();
  await app.screenshot("access-link-errors");
});
