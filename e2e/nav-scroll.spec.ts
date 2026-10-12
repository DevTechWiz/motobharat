import { test, expect } from "@playwright/test";

const logoLink = 'header a[href="/"]';

test("logo click from a scrolled page lands at the top of home", async ({ page }) => {
  await page.goto("/rides");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  await page.locator(logoLink).first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect
    .poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 })
    .toBeLessThan(50);
});

test("logo click on home scrolls back to top", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  await page.locator(logoLink).first().click();
  await expect
    .poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 })
    .toBeLessThan(50);
});

for (const target of ["/rides", "/announcements", "/safety"]) {
  test(`topbar link to ${target} lands at the very top`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
    await page.locator(`header nav a[href="${target}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`${target}/?$`));
    await expect
      .poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeLessThan(50);
  });
}
