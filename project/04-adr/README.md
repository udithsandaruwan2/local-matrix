# Architecture decision records

One decision per file. Numbered, immutable, short.

## Naming

`NNNN-<kebab-title>.md` — e.g. `0001-use-postgres.md`.

## Lifecycle

`proposed → accepted → superseded`

Never edit an accepted ADR to change its decision. Write a new ADR that supersedes it.

## Create one

```bash
./scripts/new.sh adr "Use Postgres for primary storage"
```

Or copy `.agents/templates/adr.md`.

## Index

| ADR | Decision | Status | Date |
|---|---|---|---|
| [0001](0001-monorepo-react-nestjs.md) | Monorepo with React/Vite web, NestJS API, worker, and embed app | accepted | 2026-10-30 |
| [0002](0002-postgres-postgis-prisma.md) | PostgreSQL + PostGIS + TimescaleDB with Prisma 7 | accepted | 2026-10-30 |
| [0003](0003-maplibre-vector-tiles.md) | MapLibre GL JS with vector tiles | accepted | 2026-10-30 |
| [0004](0004-websocket-redis-fanout.md) | Custom WebSocket gateway + Redis pub/sub for v1 | accepted | 2026-10-30 |
| [0005](0005-tenant-isolation-rls.md) | Tenant isolation with workspace_id + Postgres RLS | accepted | 2026-10-30 |
| [0006](0006-embed-token-model.md) | Signed short-lived embed tokens + iframe/web component | accepted | 2026-10-30 |
| [0007](0007-better-auth.md) | Better Auth for identity and workspaces | accepted | 2026-10-30 |
| [0008](0008-netlify-vercel-neon-deploy.md) | Netlify + Vercel + Neon for v1 | accepted | 2026-10-30 |
| [0009](0009-canonical-telemetry-schema.md) | Canonical telemetry schema with JSONB sensors | accepted | 2026-10-30 |
