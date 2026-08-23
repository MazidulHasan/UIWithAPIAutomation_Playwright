import { faker } from '@faker-js/faker';

export interface ArticleData {
  title: string;
  description: string;
  body: string;
  tags: string[];
}

/**
 * Builds a randomized, unique article payload so tests never collide on
 * hard-coded titles/slugs across parallel workers or repeated runs.
 */
export function generateArticle(overrides: Partial<ArticleData> = {}): ArticleData {
  const uniqueSuffix = faker.string.alphanumeric(6);
  return {
    title: `${faker.hacker.adjective()} ${faker.hacker.noun()} ${uniqueSuffix}`.replace(/\s+/g, ' ').trim(),
    description: faker.lorem.sentence({ min: 4, max: 8 }),
    body: faker.lorem.paragraphs({ min: 1, max: 3 }, '\n\n'),
    tags: [faker.word.sample(), faker.word.sample()],
    ...overrides,
  };
}

export function generateBio(): string {
  return faker.lorem.sentence({ min: 5, max: 12 });
}

export function generateImageUrl(): string {
  return faker.image.avatarGitHub();
}

export interface DisposableUser {
  username: string;
  email: string;
  password: string;
}

/**
 * A throwaway account for scenarios that must not share mutable state
 * (e.g. profile settings) with the framework's persistent session user.
 * Username is capped at 20 chars to satisfy the app's registration rule.
 */
export function generateUser(): DisposableUser {
  const suffix = faker.string.alphanumeric(8);
  return {
    username: `qa_${suffix}`,
    email: `qa.${suffix}@example.com`,
    password: `Test${faker.string.alphanumeric(10)}!`,
  };
}
