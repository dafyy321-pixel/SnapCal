# Debug report: React development CSP error

- **Symptom:** Opening the app in development logged `eval() is not supported in this environment`.
- **Root cause:** The proxy applied a production-strength `script-src` directive in every environment, while React's development build uses `eval()` for debugging call-stack reconstruction.
- **Fix:** `contentSecurityPolicy` now adds `'unsafe-eval'` only when `NODE_ENV` is `development`.
- **Evidence:** The regression test fails before the fix and passes after it. A live development response includes `'unsafe-eval'`; a live production response does not. Both return HTTP 200.
- **Regression test:** `tests/local-app.test.ts` verifies the development and production policies independently.
- **Related:** The CSP was introduced in commit `8bdc234`; its existing test only covered production hydration scripts.
- **Status:** DONE
