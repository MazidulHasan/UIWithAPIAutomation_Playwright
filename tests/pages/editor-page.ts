import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export interface EditorFormData {
  title?: string;
  description?: string;
  body?: string;
  tags?: string[];
}

export class EditorPage extends BasePage {
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly bodyTextarea: Locator;
  readonly tagsInput: Locator;
  readonly tagPills: Locator;
  readonly publishButton: Locator;

  constructor(page: Page) {
    super(page);
    this.titleInput = page.getByPlaceholder('Article Title');
    this.descriptionInput = page.getByPlaceholder("What's this article about?");
    this.bodyTextarea = page.getByPlaceholder('Write your article (in markdown)');
    this.tagsInput = page.getByPlaceholder('Enter tags');
    this.tagPills = page.locator('.tag-list .tag-pill');
    this.publishButton = page.getByRole('button', { name: 'Publish Article' });
  }

  async gotoNew(): Promise<void> {
    await this.page.goto('/editor');
  }

  async gotoEdit(slug: string): Promise<void> {
    await this.page.goto(`/editor/${encodeURIComponent(slug)}`);
  }

  async fillArticle(data: EditorFormData): Promise<void> {
    if (data.title !== undefined) await this.titleInput.fill(data.title);
    if (data.description !== undefined) await this.descriptionInput.fill(data.description);
    if (data.body !== undefined) await this.bodyTextarea.fill(data.body);
    if (data.tags) {
      for (const tag of data.tags) {
        await this.tagsInput.fill(tag);
        await this.tagsInput.press('Enter');
      }
    }
  }

  async clearTitle(): Promise<void> {
    await this.titleInput.fill('');
  }

  async publish(): Promise<void> {
    await this.publishButton.click();
  }
}
