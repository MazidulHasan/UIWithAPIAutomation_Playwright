import { Page, APIRequestContext } from '@playwright/test';
import { test, expect } from '../fixtures/fixtures';
import { generateBio, generateImageUrl, generateUser } from '../utils/test-data';
import { ConduitApiClient } from '../api/api-client';
import { LoginPage } from '../pages/login-page';

// A username that already exists on the live site (the seed content author),
// used to exercise the "username already taken" path.
const ALREADY_TAKEN_USERNAME = 'Artem Bondar';

// Settings mutate account-level state (a single "bio"/"image" field), so
// this spec opts out of the shared session and authenticates a disposable
// user per test instead. That keeps it safe to run in parallel across
// chromium/firefox/webkit without one browser's update racing another's.
test.use({ storageState: { cookies: [], origins: [] } });

async function loginAsDisposableUser(page: Page, request: APIRequestContext) {
  const user = generateUser();
  const apiClient = await ConduitApiClient.register(request, user);

  // Real UI login (same reliable path as tests/auth/auth.setup.ts) rather
  // than injecting the token into localStorage directly: the app resolves
  // its auth guard asynchronously, so a raw storage write can race it.
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(user.email, user.password);
  await expect(page.getByRole('link', { name: user.username })).toBeVisible();

  return { user, apiClient };
}

test.describe('Update User Settings', () => {
  test('updating bio and profile image persists the change and redirects to the profile page', async ({
    page,
    request,
    settingsPage,
    profilePage,
  }) => {
    const { user, apiClient } = await loginAsDisposableUser(page, request);
    const newBio = generateBio();
    const newImage = generateImageUrl();

    await settingsPage.goto();
    // The settings form loads blank by design (the app only applies fields
    // that are actually submitted), so only the fields under test are filled.
    await settingsPage.fillSettings({ bio: newBio, image: newImage });
    await settingsPage.submit();

    await expect(page).toHaveURL(new RegExp(`/profile/${user.username}$`));
    await expect(profilePage.bio).toHaveText(newBio);
    await expect(profilePage.profileImage).toHaveAttribute('src', newImage);

    const updatedUser = await apiClient.getCurrentUser();
    expect(updatedUser.bio).toBe(newBio);
    expect(updatedUser.image).toBe(newImage);
  });

  test('changing the username to one that is already taken fails without silently succeeding', async ({
    page,
    request,
    settingsPage,
  }) => {
    const { user } = await loginAsDisposableUser(page, request);

    await settingsPage.goto();
    await settingsPage.fillSettings({ username: ALREADY_TAKEN_USERNAME });

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/user') && res.request().method() === 'PUT'),
      settingsPage.submit(),
    ]);

    // The update must not silently succeed against a conflicting username.
    expect(response.ok()).toBe(false);
    await expect(page).toHaveURL(/\/settings$/);

    // Data integrity: the account's username is unaffected by the failed attempt.
    const freshClient = await ConduitApiClient.login(request, user.email, user.password);
    const current = await freshClient.getCurrentUser();
    expect(current.username).toBe(user.username);
  });
});
