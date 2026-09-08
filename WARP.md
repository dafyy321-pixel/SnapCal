# SnapCal development notes

SnapCal is a local, single-user nutrition tracker built with Next.js 16, React 19, and Node.js built-in SQLite.

## Commands

```bash
npm ci
npm run dev
npm run type-check
npm run lint
npm test
npm run build
```

Node.js 22.13 or newer is required. npm is the supported package manager.

## Local data

- `data/snapcal.db` stores the profile, meals, and analysis results.
- `data/uploads/` stores uploaded food images.
- `SNAPCAL_DB_PATH` overrides the database path.
- `SNAPCAL_TIME_ZONE` overrides the default `Asia/Shanghai` time zone.

Both default data paths are ignored by Git. Back up the complete `data` directory while the app is stopped.

## Food analysis

`POST /api/analyze` and food inventory recognition use `OPENAI_API_KEY` with `OPENAI_MODEL` or `OPENAI_VISION_MODEL`; text suggestions use `OPENAI_TEXT_MODEL` or the base model. `DOUBAO_API_KEY` remains a legacy fallback. Missing configuration returns `AI_NOT_CONFIGURED`. Current user consent is required before every external send, including retries.

Offline recording, statistics and local rule suggestions remain available. Mock recognition requires explicit `USE_MOCK_ANALYSIS=true` in development/tests and is disabled in production. Run `npm run env:check` to inspect configuration without printing secrets.

The server validates uploaded JPEG, PNG, WebP, and GIF files, stores them locally, and caches analysis results by SHA-256 hash.

## Security boundary

The API is intended only for the loopback-bound local service. Do not expose it directly to the public internet without trusted access control in front of it.
