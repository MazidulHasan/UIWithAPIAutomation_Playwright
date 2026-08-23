import { test, expect } from '../fixtures/fixtures';
import { generateArticle } from '../utils/test-data';
import { Article } from '../api/api-client';

test.describe('Edit Article', () => {
  let seedArticle: Article;

  test.beforeEach(async ({ apiClient }) => {
    // Pre-condition: create the article via API so the UI test only
    // exercises the edit flow itself.
    seedArticle = await apiClient.createArticle(generateArticle());
  });

  test.afterEach(async ({ apiClient }) => {
    await apiClient.deleteArticle(seedArticle.slug);
  });

  test('editing title, description and body updates the article and redirects to its new slug', async ({
    page,
    editorPage,
    articlePage,
    apiClient,
  }) => {
    const updates = generateArticle();

    await editorPage.gotoEdit(seedArticle.slug);
    await expect(editorPage.titleInput).toHaveValue(seedArticle.title);

    await editorPage.fillArticle({
      title: updates.title,
      description: updates.description,
      body: updates.body,
    });
    await editorPage.publish();

    // Title changed -> slug is regenerated; redirect lands on the new slug.
    await expect(page).toHaveURL(/\/article\/.+/);
    const newSlug = new URL(page.url()).pathname.replace('/article/', '');
    expect(newSlug).not.toBe(seedArticle.slug);

    await expect(articlePage.title).toHaveText(updates.title);
    await expect(articlePage.bodyContent).toContainText(updates.body);

    // Data persistence: server reflects the edit, old slug is gone.
    const updated = await apiClient.getArticle(newSlug);
    expect(updated?.title).toBe(updates.title);
    expect(updated?.description).toBe(updates.description);
    expect(updated?.body).toBe(updates.body);
    expect(await apiClient.getArticle(seedArticle.slug)).toBeNull();

    seedArticle = updated!; // afterEach cleans up under the new slug.
  });

  test('submitting a blank title on edit does not corrupt the article', async ({
    page,
    editorPage,
    articlePage,
    apiClient,
  }) => {
    await editorPage.gotoEdit(seedArticle.slug);
    // Wait for the async prefill (GET article by slug) to land before
    // clearing the field, otherwise the late patchValue() re-fills it.
    await expect(editorPage.titleInput).toHaveValue(seedArticle.title);
    await editorPage.clearTitle();
    await editorPage.publish();

    // Unlike Create Article (POST), the API accepts an empty title on
    // update (PUT) and silently keeps the existing value instead of
    // returning a validation error — a real inconsistency (see README).
    // The important QA assertion either way: the article must not end up
    // with a blank/corrupted title.
    await expect(page).toHaveURL(new RegExp(`/article/${seedArticle.slug}$`));
    await expect(articlePage.title).toHaveText(seedArticle.title);

    const unchanged = await apiClient.getArticle(seedArticle.slug);
    expect(unchanged?.title).toBe(seedArticle.title);
  });
});
