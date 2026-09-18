import { test, expect } from '@playwright/test';
import Ajv from 'ajv';
import { faker } from '@faker-js/faker';

// AJV schema: validate the important API contract fields returned by POST /articles.
const ajv = new Ajv({ allErrors: true });
const validateCreatedArticle = ajv.compile({
  type: 'object',
  required: ['article'],
  properties: {
    article: {
      type: 'object',
      required: ['slug', 'title', 'description', 'body', 'tagList', 'author'],
      properties: {
        slug: { type: 'string', minLength: 1 },
        title: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        body: { type: 'string' },
        tagList: { type: 'array', items: { type: 'string' } },
        author: {
          type: 'object',
          required: ['username'],
          properties: { username: { type: 'string', minLength: 1 } },
        },
      },
    },
  },
});

test('simple flow: Faker data + login + POST article + AJV validation', async ({ playwright }) => {
  // const email = process.env.TEST_USER_EMAIL;
  // const password = process.env.TEST_USER_PASSWORD;
  const email = 'test2211@gmail.com';
    const password = 'test2211';
  // test.skip(!email || !password, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD before running this test.');

  const apiUrl = `${process.env.API_URL || 'https://conduit-api.bondaracademy.com/api'}`.replace(/\/?$/, '/');
  const api = await playwright.request.newContext({ baseURL: apiUrl });
  let slug;
  let headers;

  try {
    // 1. Login and read the token from the JSON response.
    const loginResponse = await api.post('users/login', { data: { user: { email, password } } });
    expect(loginResponse.ok()).toBeTruthy();
    const loginBody = await loginResponse.json();
    headers = { Authorization: `Token ${loginBody.user.token}` };

    // 2. Faker creates fresh data, avoiding collisions with other runs.
    const article = {
      title: `AJV Faker ${faker.string.alphanumeric(10)} ${Date.now()}`,
      description: faker.lorem.sentence(),
      body: faker.lorem.paragraph(),
      tagList: ['playwright', 'ajv', 'faker'],
    };

    // 3. Make the authenticated POST request.
    const createResponse = await api.post('articles/', { headers, data: { article } });
    expect(createResponse.ok()).toBeTruthy();
    const responseBody = await createResponse.json();
    slug = responseBody.article.slug;

    // 4. AJV validates the response contract; regular assertions validate our business data.
    const schemaIsValid = validateCreatedArticle(responseBody);
    expect(schemaIsValid, JSON.stringify(validateCreatedArticle.errors)).toBeTruthy();
    expect(responseBody.article).toMatchObject({
      title: article.title,
      description: article.description,
      body: article.body,
    });
    expect(responseBody.article.tagList).toEqual(expect.arrayContaining(article.tagList));
  } finally {
    // 5. Delete only data owned by this test, even when an assertion fails.
    if (slug) await api.delete(`articles/${encodeURIComponent(slug)}`, { headers });
    await api.dispose();
  }
});
