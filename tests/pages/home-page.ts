import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

function exactTagRegex(tag: string): RegExp {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s*${escaped}\\s*$`);
}

export class HomePage extends BasePage {
  readonly popularTags: Locator;
  readonly feedToggleTabs: Locator;
  readonly activeFeedTab: Locator;
  readonly articlePreviews: Locator;
  readonly emptyFeedMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.popularTags = page.locator('.sidebar .tag-list a.tag-pill');
    this.feedToggleTabs = page.locator('.feed-toggle .nav-link');
    this.activeFeedTab = page.locator('.feed-toggle .nav-link.active');
    this.articlePreviews = page.locator('.article-preview');
    this.emptyFeedMessage = page.getByText('No articles are here', { exact: false });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  tagPill(tagName: string): Locator {
    return this.popularTags.filter({ hasText: exactTagRegex(tagName) });
  }

  async filterByTag(tagName: string): Promise<void> {
    await this.tagPill(tagName).click();
  }

  articlePreviewTags(index: number): Locator {
    return this.articlePreviews.nth(index).locator('.tag-list .tag-pill');
  }

  articlePreviewTitle(index: number): Locator {
    return this.articlePreviews.nth(index).locator('.preview-link h1');
  }

  async firstArticlePreviewLink(): Promise<Locator> {
    return this.articlePreviews.first().locator('a.preview-link');
  }
}
