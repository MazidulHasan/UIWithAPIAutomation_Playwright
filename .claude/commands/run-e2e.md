---
description: Run the Conduit Playwright E2E suite, triage any failures, and summarize results with report links
argument-hint: "[project: chromium|firefox|webkit|all] [extra playwright test args]"
---

You are running the Conduit end-to-end regression suite for this repository (Playwright + TypeScript, testing https://conduit.bondaracademy.com/).

Arguments passed to this command: $ARGUMENTS

## Steps

1. **Resolve scope.** If `$ARGUMENTS` names a browser project (`chromium`, `firefox`, `webkit`), run only that project. If it says `all` or is empty, run the full cross-browser matrix. Pass through any remaining arguments (e.g. a spec file path, `--grep <pattern>`, `--headed`) directly to `npx playwright test`.

2. **Ensure the environment is ready.**
   - Confirm `node_modules` exists; if not, run `npm ci` (or `npm install` if there's no lockfile match).
   - Confirm Playwright browsers are installed; if a run fails with a "browser not found" error, run `npx playwright install --with-deps` and retry once.
   - Confirm `.env` exists (copy from `.env.example` and warn the user if it's missing — tests need `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` for a pre-registered account on the live site).

3. **Run the suite** with `npx playwright test` (plus the resolved project/args from step 1). The `setup` project (tests/auth/auth.setup.ts) runs automatically first via project dependencies to (re)establish the authenticated session in `playwright/.auth/user.json`.

4. **If anything fails:**
   - Read the failure output carefully (assertion diffs, timeouts, network errors).
   - Open the relevant spec file(s) under `tests/e2e/` and the page object(s) under `tests/pages/` involved.
   - Distinguish three failure classes and act accordingly:
     - **Locator/selector drift** (the site's markup changed) — update the page object locator, don't just retry.
     - **Real regression** (assertion correctly caught wrong app behavior) — report it clearly, do not "fix" the test to hide it.
     - **Flake** (timing, network blip) — rerun with `--retries=1` to confirm; if it passes, note it as flaky rather than silently ignoring it.
   - Prefer investigating with `npx playwright test <file> --headed --debug` or by inspecting the trace (`npx playwright show-trace test-results/.../trace.zip`) over guessing.
   - Re-run the affected test(s) after any fix to confirm they pass before moving on.

5. **Generate reports:**
   - HTML report is written to `playwright-report/` automatically. Mention that `npm run report:html` opens it.
   - Generate the Allure report: `npm run report:allure:generate` (writes to `allure-report/`). Mention `npm run report:allure:open` to view it.

6. **Summarize for the user:**
   - Pass/fail counts per browser project.
   - Any test(s) fixed, with a one-line root cause each.
   - Any flaky test(s) observed.
   - Where to find the reports (paths from step 5).

Keep the summary concise — the user is a senior QA automation engineer and wants a status report, not a narrated transcript.
