import { test as base, expect } from '@playwright/test';
import { ConduitApiClient } from '../api/api-client';
import { HomePage } from '../pages/home-page';
import { LoginPage } from '../pages/login-page';
import { EditorPage } from '../pages/editor-page';
import { ArticlePage } from '../pages/article-page';
import { SettingsPage } from '../pages/settings-page';
import { ProfilePage } from '../pages/profile-page';

interface Fixtures {
  apiClient: ConduitApiClient;
  homePage: HomePage;
  loginPage: LoginPage;
  editorPage: EditorPage;
  articlePage: ArticlePage;
  settingsPage: SettingsPage;
  profilePage: ProfilePage;
}

/**
 * Extends the base Playwright test with the Conduit page objects and an
 * authenticated API client, so every spec can request only what it needs.
 */
export const test = base.extend<Fixtures>({
  apiClient: async ({ request }, use) => {
    const client = await ConduitApiClient.login(request);
    await use(client);
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  editorPage: async ({ page }, use) => {
    await use(new EditorPage(page));
  },
  articlePage: async ({ page }, use) => {
    await use(new ArticlePage(page));
  },
  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
});

export { expect };
