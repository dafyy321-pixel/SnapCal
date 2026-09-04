# SnapCal QA Report

- Date: 2026-09-04
- Target: `http://localhost:3100`
- Framework: Next.js 16 / React 19
- Viewport: 360 x 800
- Scope: wellness features, primary navigation, CRUD flows, settings and export
- Duration: approximately 45 minutes including a development-server restart
- Status: complete with one protected-file accessibility item deferred

## Baseline summary

Pages checked: `/`, `/records`, `/analytics`, `/workouts/new`, `/templates`, `/check-in`, `/body-metrics`, `/scan?mode=inventory`, `/profile`, `/profile/goals`, `/profile/ai`, `/profile/export`, `/profile/help`, `/profile/about`, and a generated `/workouts/:id` page.

Verified flows:

- Opened the quick-record sheet and followed its workout entry.
- Created a workout from the built-in home full-body template, opened its detail page, then deleted the QA record.
- Saved and deleted a daily check-in.
- Validated empty body-metric submission, then saved and deleted a weight record.
- Copied a built-in workout template, verified the custom copy, then deleted it.
- Verified insufficient-data details for weekly experiments.
- Confirmed the 360 px pages tested do not create document-level horizontal overflow and fixed navigation does not cover the primary save actions.

## Findings

### ISSUE-001: Export select defaults are invisible

- Severity: Medium
- Category: Functional / UX
- Route: `/profile/export`
- Reproduction: Open the route or reload it. Both select triggers render as blank 50 px buttons even though `全部数据` and `JSON（完整备份）` are selected. Opening and choosing an option makes both labels appear.
- Impact: Users cannot see the current export range or file format before interacting with a control.
- Evidence: Captured inline before repair in the Codex QA run.
- Fix status: Verified. Controlled labels now render immediately at full width; targeted regression test, TypeScript and ESLint passed.
- Commit: `74bd8b3`

### ISSUE-002: Help accordion did not switch on the degraded 3000-port server

- Severity: Closed as environment false positive
- Category: Environment
- Route: `/profile/help`
- Reproduction: The symptom appeared twice while the original development server had thousands of closed connections and route requests were timing out.
- Impact: None in the application. On the restarted stable 3100-port server, the same control switched answers correctly.
- Evidence: Captured inline before repair in the Codex QA run.
- Fix status: No source fix needed; stable-server browser re-test passed.

### ISSUE-003: Icon-only controls have no accessible name

- Severity: Medium
- Category: Accessibility
- Routes: `/profile/goals`, `/profile/help`, `/profile/about`, `/scan?mode=inventory`
- Reproduction: Inspect the accessibility tree. Goals has six unnamed buttons (back, save, and four weight step controls); help/about have unnamed back controls; scan has an unnamed close control.
- Impact: Screen-reader and voice-control users cannot identify these controls.
- Evidence: Captured inline before repair in the Codex QA run.
- Fix status: Verified for goals, help and about. Targeted regression test, TypeScript, ESLint and browser accessibility-tree checks passed. The scan close control remains deferred because its page contains user-owned uncommitted changes.
- Commit: `1552229`

### ISSUE-004: Direct-entry back navigation leaves the app

- Severity: Medium
- Category: UX / Navigation
- Route: `/check-in` (representative of detail pages using history back)
- Reproduction: Open `/check-in` in a fresh browser tab and activate `返回`. The tab navigates to `about:blank`.
- Impact: A refreshed or directly opened feature page has no reliable route back into SnapCal.
- Evidence: Before and after states captured inline in the Codex QA run.
- Fix status: Verified. Shared mobile feature headers now use history when available and fall back to `/` for direct entry; direct-entry and in-app browser flows both passed, along with targeted regression test, TypeScript and ESLint.
- Commit: `2fd70da`

## Final verification

- `npm run type-check`: passed
- `npm run lint`: passed
- `npm test`: 114 passed, 0 failed
- `npm run build`: passed; 35 static pages generated
- Asia/Shanghai date boundary regression: passed for meals, workouts and action cards (`853d33a`)
- Stable development-server log: no 5xx responses or product runtime errors; missing check-in 404 responses were expected empty-state requests

## Health score

| Category | Baseline | Final |
|---|---:|---:|
| Console | 100 | 100 |
| Links | 100 | 100 |
| Visual | 100 | 100 |
| Functional | 92 | 100 |
| UX | 84 | 100 |
| Performance | 100 | 100 |
| Content | 100 | 100 |
| Accessibility | 92 | 92 |
| **Weighted total** | **94.8** | **98.8** |

The remaining accessibility deduction is the unnamed close button in `app/scan/page.tsx`. That file was deliberately not edited or staged because it contains user-owned uncommitted layout work.

## Summary

- Product issues confirmed: 3
- Verified fixes: 3
- Environment false positives closed: 1
- Deferred: 1 protected-file accessibility label
- Health score: 94.8 -> 98.8
- PR summary: QA found 3 product issue groups, fixed all unprotected findings, and raised the health score from 94.8 to 98.8.
