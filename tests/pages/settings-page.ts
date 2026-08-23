import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export interface SettingsFormData {
  image?: string;
  username?: string;
  bio?: string;
  email?: string;
  password?: string;
}

export class SettingsPage extends BasePage {
  readonly imageInput: Locator;
  readonly usernameInput: Locator;
  readonly bioTextarea: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly updateSettingsButton: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.imageInput = page.getByPlaceholder('URL of profile picture');
    this.usernameInput = page.getByPlaceholder('Username');
    this.bioTextarea = page.getByPlaceholder('Short bio about you');
    this.emailInput = page.getByPlaceholder('Email');
    this.passwordInput = page.getByPlaceholder('New Password');
    this.updateSettingsButton = page.getByRole('button', { name: 'Update Settings' });
    this.logoutButton = page.getByRole('button', { name: 'Or click here to logout.' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings');
  }

  async fillSettings(data: SettingsFormData): Promise<void> {
    if (data.image !== undefined) await this.imageInput.fill(data.image);
    if (data.username !== undefined) await this.usernameInput.fill(data.username);
    if (data.bio !== undefined) await this.bioTextarea.fill(data.bio);
    if (data.email !== undefined) await this.emailInput.fill(data.email);
    if (data.password !== undefined) await this.passwordInput.fill(data.password);
  }

  async submit(): Promise<void> {
    await this.updateSettingsButton.click();
  }
}
