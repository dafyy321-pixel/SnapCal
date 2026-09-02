# SnapCal repository notes

- This is a local, single-user Next.js application. Keep it loopback-only and avoid remote-database assumptions.
- Persistent data lives in SQLite through `lib/local-db.ts`; uploaded files live under `data/uploads`.
- API routes validate their own body/query once with Zod and return the shared envelope from `lib/error-handler.ts`.
- Keep the client free of database imports. Browser code uses `/api/*` through `lib/api-services.ts`.
- The optional `DOUBAO_API_KEY` enables remote analysis. With no key, local mock analysis is expected behavior.
- Use Node.js 22.13 or newer because the project relies on `node:sqlite`.
- Before committing, run `npm run type-check`, `npm run lint`, `npm test`, and `npm run build`.
- Never commit `.mcp.json`, `.claude/settings.local.json`, database files, or uploaded images.
