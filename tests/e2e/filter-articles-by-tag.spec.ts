import { test, expect } from '../fixtures/fixtures';

const KNOWN_TAG = 'Git';

test.describe('Filter Articles by Tag', () => {
  test('selecting a popular tag filters the feed to only articles containing that tag', async ({
    page,
    homePage,
  }) => {
    await homePage.goto();
    await expect(homePage.tagPill(KNOWN_TAG)).toBeVisible();

    const filteredResponse = page.waitForResponse(
      (response) => response.url().includes('/api/articles') && response.url().includes(`tag=${KNOWN_TAG}`),
    );
    await homePage.filterByTag(KNOWN_TAG);
    const response = await filteredResponse;
    expect(response.ok()).toBeTruthy();

    // The feed toggle grows a new, active tab named after the tag.
    await expect(homePage.activeFeedTab).toHaveText(new RegExp(KNOWN_TAG));

    // Every visible article preview must be tagged with it.
    const count = await homePage.articlePreviews.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(homePage.articlePreviewTags(i).getByText(KNOWN_TAG, { exact: true })).toHaveCount(1);
    }
  });

  test('a tag with no matching articles renders the empty-feed message instead of stale results', async ({
    page,
    homePage,
  }) => {
    await homePage.goto();

    // Deterministically simulate the "no results" case at the network layer
    // rather than depending on a real-world tag happening to be empty.
    await page.route(/\/api\/articles\?tag=/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ articles: [], articlesCount: 0 }),
      });
    });

    await homePage.filterByTag(KNOWN_TAG);

    await expect(homePage.emptyFeedMessage).toBeVisible();
    await expect(page.locator('.article-preview a.preview-link')).toHaveCount(0);
  });
});
