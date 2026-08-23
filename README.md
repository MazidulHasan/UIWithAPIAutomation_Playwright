# Conduit E2E Automation Framework

Playwright + TypeScript end-to-end regression suite for [conduit.bondaracademy.com](https://conduit.bondaracademy.com/), a RealWorld ("Conduit") reference blogging app.

## Scenarios covered

| Scenario | Positive | Negative | API pre-condition |
|---|---|---|---|
| Create Article | ✅ publish → redirect, content & tags render, persisted server-side | ✅ blank title → validation error, stays on `/editor` | — |
| Edit Article | ✅ edit → slug regenerates, content updates, persisted | ✅ blank title → API silently ignores it, article not corrupted (see finding below) | ✅ article created via API |
| Delete Article | ✅ delete → redirect home, gone server-side | ✅ non-owner sees no Edit/Delete controls | ✅ article created via API |
| Filter Articles by Tag | ✅ tag click → feed filtered, every result tagged | ✅ zero-result tag → empty-state message (network-mocked) | — |
| Update User Settings | ✅ bio/image update → persists, profile reflects it | ✅ duplicate username → request fails, account unaffected (see finding below) | — |

## Architecture

```
tests/
  api/          ConduitApiClient — REST wrapper for pre-conditions & assertions
  auth/         auth.setup.ts — logs in once, persists storage state
  e2e/          The 5 scenario spec files (positive + negative each)
  fixtures/     Custom `test` that injects page objects + apiClient
  pages/        Page Object Model (one class per page/component)
  utils/        env.ts (config), test-data.ts (faker-based dynamic data)
```

**Page Object Model** — every page/component (`HomePage`, `LoginPage`, `EditorPage`, `ArticlePage`, `SettingsPage`, `ProfilePage`) extends `BasePage`, which centralizes the nav bar and the app's shared `ul.error-messages` validation component. Locators prefer role/placeholder-based queries (resilient to markup/styling changes); a few list/state locators use the app's stable CSS classes (`.article-preview`, `.tag-list`, `.feed-toggle`) where no accessible role exists.

**Session reuse** — `tests/auth/auth.setup.ts` runs once as a Playwright "setup project" dependency, logs in through the real UI, and saves `storageState` to `playwright/.auth/user.json`. Every `chromium`/`firefox`/`webkit` project reuses that file, so only one real login happens per full test run instead of one per test.

**API pre-conditions** — `ConduitApiClient` (backed by Playwright's `APIRequestContext`) creates/reads/deletes articles directly against `conduit-api.bondaracademy.com`, used for the Edit/Delete Article pre-conditions and as an independent source of truth for "data persistence" assertions (never trust the UI alone to prove a write succeeded).

**Test isolation** — Settings mutate a single account-level field (bio/image), so `update-settings.spec.ts` opts out of the shared session and registers a disposable throwaway user per test. This keeps it safe under `fullyParallel` execution across three browser projects at once, where a shared account would otherwise race.

**Dynamic test data** — `tests/utils/test-data.ts` uses `@faker-js/faker` to generate unique article titles/bodies/tags, bios, and disposable user credentials on every run, avoiding hard-coded fixtures and slug collisions.

## Setup

```bash
npm install
npx playwright install --with-deps
cp .env.example .env   # already pre-filled with a working QA test account
```

The `.env` file holds credentials for a dedicated QA automation account (already registered on the live site). If you rotate it, register a new account at `/register` first and update `.env` accordingly.

## Running tests

```bash
npm test                    # full cross-browser matrix (chromium, firefox, webkit)
npm run test:chromium       # single browser
npm run test:headed         # headed, useful for debugging
npm run test:ui             # Playwright UI mode
npx playwright test tests/e2e/create-article.spec.ts   # single spec
npm run typecheck           # strict TypeScript check (tsc --noEmit)
```

Or use the packaged Claude Code command: `/run-e2e` (optionally `/run-e2e chromium`).

## Reports

- **HTML report** (built-in): `npm run report:html`
- **Allure report** (richer, CI-shareable): `npm run report:allure` (generates + opens)
- On failure, Playwright captures a **trace** and **screenshot**; open a trace with `npx playwright show-trace test-results/<test-folder>/trace.zip`.

## CI/CD

`.github/workflows/playwright.yml` runs the suite on every push/PR across all three browsers in a matrix, uploads the HTML report, Allure results, and failure traces/screenshots as artifacts, then merges all Allure results into one combined report artifact. Set repository secrets `TEST_USER_USERNAME`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` (and optionally `BASE_URL`/`API_URL`) so CI runs use their own credentials rather than the values baked into `.env.example`.

## Known application observations

Discovered through actual test execution and folded into the negative test assertions rather than ignored:

- **`PUT /articles/:slug` and `PUT /user` silently ignore blank fields** instead of validating them, unlike their `POST` (create/register) counterparts which do validate. E.g. clearing an article's title on the Edit page and publishing returns `200` with the *original* title unchanged — no error is shown. `edit-article.spec.ts`'s negative test asserts the article isn't corrupted by this, rather than asserting an error message that never appears.
- **Settings accepts malformed emails and over-length usernames** with no validation at all (client or server) — e.g. `not-an-email` or a 30-character username are both accepted and persisted, even though registration correctly rejects a >20-character username. Only a genuinely **conflicting** (already-taken) username reliably fails, and it does so with an unhandled `500` rather than a `422` + user-facing message. `update-settings.spec.ts`'s negative test targets that conflict case and asserts the account is left unaffected.

These are real defects worth flagging to the app team; they're called out here rather than baked into tests that assert behavior the app doesn't actually exhibit.
