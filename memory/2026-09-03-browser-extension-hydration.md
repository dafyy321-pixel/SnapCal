# Debug report: browser extension hydration mismatch

- **Symptom:** React reported an attribute mismatch on the root `<html>` element during hydration.
- **Root cause:** The Immersive Translate browser extension added `data-immersive-translate-page-theme="light"` before React hydrated the server-rendered document.
- **Fix:** The root `<html>` now uses React's `suppressHydrationWarning`, scoped to that element only.
- **Evidence:** A regression check failed before the change and passes after it. Tests, type checking, lint, and the production build all pass.
- **Regression test:** `tests/local-app.test.ts` verifies that the root layout retains the hydration compatibility property.
- **Related:** This is external DOM mutation, not nondeterministic application rendering.
- **Status:** DONE
