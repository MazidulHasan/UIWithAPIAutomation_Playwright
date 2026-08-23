import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class ProfilePage extends BasePage {
  readonly username: Locator;
  readonly bio: Locator;
  readonly profileImage: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.locator('.user-info h4');
    this.bio = page.locator('.user-info p');
    this.profileImage = page.locator('.user-info img.user-img');
  }

  async goto(username: string): Promise<void> {
    await this.page.goto(`/profile/${encodeURIComponent(username)}`);
  }
}
