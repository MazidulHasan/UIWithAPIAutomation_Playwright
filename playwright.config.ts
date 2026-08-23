import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, AUTH_STORAGE_STATE } from './tests/utils/env';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry flaky tests to absorb minor timing/network flakiness. */
  retries: process.env.CI ? 2 : 1,
  /* Parallel workers - capped on CI, unlimited locally. */
  workers: process.env.CI ? 2 : undefined,

  timeout: 30_000,
  expect: { timeout: 8_000 },

  /* Multiple reporters: readable console output, a self-contained HTML
   * report, and Allure results for rich, shareable test reports. */
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  use: {
    baseURL: BASE_URL,
    /* Capture a trace for every test that is retried, so a failure on CI
     * can always be replayed step-by-step in the trace viewer. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
  },

  projects: [
    /* Logs in once via the real UI and persists the session for reuse. */
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: AUTH_STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: AUTH_STORAGE_STATE },
      dependencies: ['setup'],
    },
  ],
});
