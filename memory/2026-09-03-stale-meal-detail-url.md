# Debug report: stale meal detail URL

- **Symptom:** A meal detail URL produced two 404 API requests and repeated browser errors in development.
- **Root cause:** The URL referenced an ID absent from both the meals and analysis tables. The API correctly returned 404, but the client treated the expected missing-record response as an exceptional load failure. React development mode replayed the effect, making the error appear twice.
- **Fix:** The detail page now handles HTTP 404 as a normal missing-record state with a return-home action. Other HTTP failures still follow the existing error path.
- **Evidence:** The regression check failed before the change and passes after it. Live browser verification displayed the missing state, recorded no console errors, and returned home successfully.
- **Regression test:** `tests/local-app.test.ts` protects the explicit 404 branch and missing-state copy.
- **Related:** No database record was restored or fabricated; stale links remain correctly represented as not found.
- **Status:** DONE
