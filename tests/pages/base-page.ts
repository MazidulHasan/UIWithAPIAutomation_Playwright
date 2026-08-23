import { Page, Locator } from '@playwright/test';

/**
 * Shared elements/behaviour available on every authenticated page:
 * the top navigation bar and the reusable server-validation error list
 * (`ul.error-messages`) that Conduit's forms (login, register, editor,
 * settings) all render identically.
 */
export class BasePage {
  readonly page: Page;
  readonly errorMessages: Locator;
  readonly newArticleNavLink: Locator;
  readonly settingsNavLink: Locator;
  readonly signInNavLink: Locator;
  readonly signUpNavLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.errorMessages = page.locator('ul.error-messages li');
    this.newArticleNavLink = page.getByRole('link', { name: 'New Article' });
    this.settingsNavLink = page.getByRole('link', { name: 'Settings' });
    this.signInNavLink = page.getByRole('link', { name: 'Sign in' });
    this.signUpNavLink = page.getByRole('link', { name: 'Sign up' });
  }

  loggedInUserNavLink(username: string): Locator {
    return this.page.getByRole('navigation').getByRole('link', { name: username, exact: true });
  }

  async getErrorMessages(): Promise<string[]> {
    return this.errorMessages.allTextContents();
  }
}
