import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { TEST_USER, AUTH_STORAGE_STATE } from '../utils/env';

/**
 * Runs once before every project (see the "setup" dependency in
 * playwright.config.ts). Logs in through the real UI exactly once and
 * persists cookies + localStorage (the app's JWT lives in localStorage
 * under "jwtToken") so every subsequent test starts already authenticated —
 * satisfying the "reuse authenticated sessions" requirement.
 */
setup('authenticate as the QA test user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(TEST_USER.email, TEST_USER.password);

  await expect(page.getByRole('link', { name: TEST_USER.username })).toBeVisible();

  await page.context().storageState({ path: AUTH_STORAGE_STATE });
});
