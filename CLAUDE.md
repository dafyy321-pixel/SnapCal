# SnapCal repository notes

- This is a local, single-user Next.js application. Keep it loopback-only and avoid remote-database assumptions.
- Persistent data lives in SQLite through `lib/local-db.ts`; uploaded files live under `data/uploads`.
- API routes validate their own body/query once with Zod and return the shared envelope from `lib/error-handler.ts`.
- Keep the client free of database imports. Browser code uses `/api/*` through `lib/api-services.ts`.
- Configure `OPENAI_API_KEY` plus `OPENAI_MODEL` (or capability-specific models) for AI; `DOUBAO_API_KEY` is a legacy fallback. Missing configuration returns `AI_NOT_CONFIGURED`, never fabricated nutrition. External sends require current user consent, including retries. `USE_MOCK_ANALYSIS=true` is an explicit development/test-only option.
- Use Node.js 22.13 or newer because the project relies on `node:sqlite`.
- Before committing, run `npm run type-check`, `npm run lint`, `npm test`, and `npm run build`.
- Never commit `.mcp.json`, `.claude/settings.local.json`, database files, or uploaded images.
