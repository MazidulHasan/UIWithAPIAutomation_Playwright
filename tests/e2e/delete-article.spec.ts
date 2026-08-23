import { test, expect } from '../fixtures/fixtures';
import { generateArticle } from '../utils/test-data';

test.describe('Delete Article', () => {
  test('deleting an owned article removes it and redirects to the home feed', async ({
    page,
    articlePage,
    apiClient,
  }) => {
    // Pre-condition: create the article via API.
    const seedArticle = await apiClient.createArticle(generateArticle());

    await articlePage.goto(seedArticle.slug);
    await expect(articlePage.title).toHaveText(seedArticle.title);

    await articlePage.deleteArticle();

    await expect(page).toHaveURL(/\/$/);

    // Data persistence: the article is actually gone server-side.
    await expect(async () => {
      expect(await apiClient.getArticle(seedArticle.slug)).toBeNull();
    }).toPass();
  });

  test('a foreign article does not expose Edit/Delete controls to a non-owner', async ({ page, articlePage }) => {
    // Seed article authored by "Artem Bondar" that ships with the app's demo data.
    await articlePage.goto('Discover-Bondar-Academy:-Your-Gateway-to-Efficient-Learning-1');

    await expect(articlePage.title).toBeVisible();
    await expect(page.getByRole('link', { name: 'Edit Article' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Delete Article' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Follow/ }).first()).toBeVisible();
  });
});
