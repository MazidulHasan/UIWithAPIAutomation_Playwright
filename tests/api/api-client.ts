import { APIRequestContext } from '@playwright/test';
import { API_URL, TEST_USER } from '../utils/env';
import { ArticleData } from '../utils/test-data';

export interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: { username: string };
}

/**
 * Thin wrapper around Conduit's REST API used to set up and verify test data
 * without going through the UI. Used both as pre-conditions (Edit/Delete
 * Article scenarios) and as an independent source of truth for assertions.
 */
export class ConduitApiClient {
  private constructor(
    private readonly context: APIRequestContext,
    private readonly token: string,
  ) {}

  static async login(
    context: APIRequestContext,
    email: string = TEST_USER.email,
    password: string = TEST_USER.password,
  ): Promise<ConduitApiClient> {
    const response = await context.post(`${API_URL}/users/login`, {
      data: { user: { email, password } },
    });
    if (!response.ok()) {
      throw new Error(`API login failed with status ${response.status()}: ${await response.text()}`);
    }
    const body = await response.json();
    return new ConduitApiClient(context, body.user.token);
  }

  /**
   * Registers a brand-new, disposable user. Used by scenarios that mutate
   * account-level state (e.g. Settings) so they never race against the
   * single shared session user across parallel browser projects.
   */
  static async register(
    context: APIRequestContext,
    user: { username: string; email: string; password: string },
  ): Promise<ConduitApiClient> {
    const response = await context.post(`${API_URL}/users`, { data: { user } });
    if (!response.ok()) {
      throw new Error(`API register failed with status ${response.status()}: ${await response.text()}`);
    }
    const body = await response.json();
    return new ConduitApiClient(context, body.user.token);
  }

  get authToken(): string {
    return this.token;
  }

  private authHeaders(): Record<string, string> {
    return { Authorization: `Token ${this.token}` };
  }

  async createArticle(article: ArticleData): Promise<Article> {
    const response = await this.context.post(`${API_URL}/articles/`, {
      headers: this.authHeaders(),
      data: {
        article: {
          title: article.title,
          description: article.description,
          body: article.body,
          tagList: article.tags,
        },
      },
    });
    if (!response.ok()) {
      throw new Error(`Create article failed (${response.status()}): ${await response.text()}`);
    }
    return (await response.json()).article;
  }

  async getArticle(slug: string): Promise<Article | null> {
    const response = await this.context.get(`${API_URL}/articles/${encodeURIComponent(slug)}`);
    if (response.status() === 404) return null;
    if (!response.ok()) {
      throw new Error(`Get article failed (${response.status()}): ${await response.text()}`);
    }
    return (await response.json()).article;
  }

  async deleteArticle(slug: string): Promise<void> {
    const response = await this.context.delete(`${API_URL}/articles/${encodeURIComponent(slug)}`, {
      headers: this.authHeaders(),
    });
    if (!response.ok() && response.status() !== 404) {
      throw new Error(`Delete article failed (${response.status()}): ${await response.text()}`);
    }
  }

  async getCurrentUser(): Promise<{ username: string; email: string; bio: string; image: string }> {
    const response = await this.context.get(`${API_URL}/user`, { headers: this.authHeaders() });
    if (!response.ok()) {
      throw new Error(`Get current user failed (${response.status()}): ${await response.text()}`);
    }
    return (await response.json()).user;
  }
}
