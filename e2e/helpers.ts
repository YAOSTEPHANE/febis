import { expect, type Page } from "@playwright/test";

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@febis.ci";
export const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? "FebisAdmin2026!";

/** Évite que la bannière cookies intercepte les clics. */
export async function dismissCookieBanner(page: Page) {
  await page.addInitScript(() => {
    const payload = {
      version: 1,
      decidedAt: new Date().toISOString(),
      preferences: {
        necessary: true,
        preferences: false,
        analytics: false,
        marketing: false,
      },
    };
    window.localStorage.setItem(
      "febis_cookie_consent",
      JSON.stringify(payload),
    );
  });
}

export async function loginAsAdmin(page: Page) {
  await dismissCookieBanner(page);
  await page.goto("/admin");
  await page.getByLabel(/email professionnel/i).fill(ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 30_000 });
  await expect(page.getByText(/FEBiS/i).first()).toBeVisible();
}
