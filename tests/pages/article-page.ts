import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class ArticlePage extends BasePage {
  readonly title: Locator;
  readonly bodyContent: Locator;
  readonly tagPills: Locator;
  readonly editLink: Locator;
  readonly deleteButton: Locator;
  readonly authorLink: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator('.banner h1');
    this.bodyContent = page.locator('.article-content');
    this.tagPills = page.locator('.article-content .tag-list .tag-pill');
    this.editLink = page.getByRole('link', { name: 'Edit Article' }).first();
    this.deleteButton = page.getByRole('button', { name: 'Delete Article' }).first();
    this.authorLink = page.locator('.article-meta .author').first();
  }

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/article/${encodeURIComponent(slug)}`);
  }

  async deleteArticle(): Promise<void> {
    await this.deleteButton.click();
  }
}
