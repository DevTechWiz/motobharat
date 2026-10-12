import { test, expect } from "@playwright/test";

// Public pages must render for anonymous visitors (docs/10_TESTS.md §4).
const publicPages = [
  { path: "/", h1: true },
  { path: "/rides", h1: true },
  { path: "/announcements", h1: true },
  { path: "/safety", h1: true },
  { path: "/login", h1: false },
  { path: "/privacy", h1: false },
  { path: "/terms", h1: false },
];

for (const { path, h1 } of publicPages) {
  test(`public page renders: ${path}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res!.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    if (h1) await expect(page.locator("main h1").first()).toBeVisible();
  });
}

test("security headers present (CSP, nosniff, frame deny)", async ({ page }) => {
  const res = await page.goto("/");
  const headers = res!.headers();
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
});

test("/login is chrome-free (no topbar, no footer)", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("header")).toHaveCount(0);
  await expect(page.locator("footer")).toHaveCount(0);
  await page.goto("/");
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("footer")).toBeVisible();
});

test("signed out: /admin redirects to /login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("signed out: /profile redirects to /login", async ({ page }) => {
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login/);
});

test("/dev/ui is 404 in production", async ({ page }) => {
  const res = await page.goto("/dev/ui");
  expect(res!.status()).toBe(404);
});

test("no CSP console violations on public pages", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (msg) => {
    if (msg.text().includes("Content Security Policy")) violations.push(msg.text());
  });
  for (const { path } of publicPages) {
    await page.goto(path);
    await page.waitForLoadState("load");
  }
  expect(violations).toEqual([]);
});
