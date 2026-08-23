import { test, expect } from '../fixtures/fixtures';
import { generateArticle } from '../utils/test-data';

test.describe('Create Article', () => {
  test('publishing an article with valid data redirects to the new article and persists it', async ({
    page,
    editorPage,
    articlePage,
    apiClient,
  }) => {
    const article = generateArticle();

    await editorPage.gotoNew();
    await editorPage.fillArticle(article);
    await editorPage.publish();

    // Redirects to the new article's detail page.
    await expect(page).toHaveURL(/\/article\/.+/);
    const slug = new URL(page.url()).pathname.replace('/article/', '');

    // UI reflects the submitted data.
    await expect(articlePage.title).toHaveText(article.title);
    await expect(articlePage.bodyContent).toContainText(article.body);
    for (const tag of article.tags) {
      await expect(articlePage.tagPills.filter({ hasText: tag })).toBeVisible();
    }
    await expect(articlePage.editLink).toBeVisible();
    await expect(articlePage.deleteButton).toBeVisible();

    // Data persistence: the article really exists server-side.
    const created = await apiClient.getArticle(slug);
    expect(created).not.toBeNull();
    expect(created?.title).toBe(article.title);
    expect(created?.description).toBe(article.description);
    expect(created?.body).toBe(article.body);
    expect(created?.tagList.sort()).toEqual([...article.tags].sort());

    // Cleanup so repeated runs don't accumulate articles.
    await apiClient.deleteArticle(slug);
  });

  test('publishing without a title shows a validation error and does not navigate away', async ({
    page,
    editorPage,
  }) => {
    const article = generateArticle();

    await editorPage.gotoNew();
    await editorPage.fillArticle({ description: article.description, body: article.body });
    await editorPage.publish();

    await expect(editorPage.errorMessages).toContainText("title can't be blank");
    await expect(page).toHaveURL(/\/editor$/);
  });
});
