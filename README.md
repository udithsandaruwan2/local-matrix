# Local Matrix

> Real-time location and sensor intelligence, on one map.

Local Matrix is a multi-tenant geospatial telemetry platform. Devices and applications send GPS and sensor data through an HTTP or MQTT ingest API. Local Matrix normalizes the data, stores the history, streams live positions to a map, and distributes the same data through query APIs, webhooks, and embeddable maps.

It is built for three audiences:

- **Operations teams** who need a live fleet/asset map, sensor readings, geofences, and alerts.
- **Developers** who need an API-first telemetry backend without building ingestion, storage, WebSockets, and map rendering.
- **Platform teams** who want to embed a branded live map into their own product with a signed, read-only token.

## Status

Planning is complete through the architecture and build-plan drafts. No product code has been written.

- **Phase:** see `project/STATE.md`
- **Product baseline:** `project/02-prd.md`, `project/02-product-catalog.md`
- **Architecture:** `project/03-architecture.md`, `project/04-adr/`
- **Build plan:** `project/05-plan.md`
- **Next action:** see the `next_action` field in `project/STATE.md`

## Product shape

```text
Devices / apps / gateways
        │  HTTPS ingest or MQTT bridge
        ▼
  NestJS + Fastify API (Vercel Function)
        │                    │
   PostgreSQL              Redis
   PostGIS + Timescale     latest state, pub/sub, queues, rate limits
   Prisma 7                │
        │                  ▼
        │           Vercel Daemon (BullMQ worker)
        │           alerts, webhooks, retention, rollups
        │
        └── WebSocket gateway ──▶ console + embedded maps

Netlify: React + Vite marketing site, auth, console
Netlify: Vite embed assets + embed.js; Vercel serves the per-embed HTML shell
```

## Planned repository layout

```text
apps/
  web/        React 19 + Vite + React Router — public home, docs, auth, console
  api/        NestJS 11 + Fastify adapter — REST ingest/query, WebSocket gateway
  worker/     NestJS + BullMQ — alerts, webhooks, retention, rollups
  embed/      Vite + MapLibre — iframe runtime and embed.js web component
packages/
  db/         Prisma 7 schema, SQL migrations, RLS policies, tenant helper
  core/       Domain logic: telemetry, geofences, alerts
  shared/     Zod contracts, types, constants
  map/        Shared MapLibre React components
  ui/         Design system on shadcn/ui + Tailwind v4
  config/     Shared TypeScript, ESLint, Vitest, Playwright config
infra/
  docker/     Local Postgres/PostGIS/Timescale, Redis, Mailpit
docs/         Agent Project Framework process playbooks
project/      Single source of truth: brief, PRD, architecture, plan, specs
```

## Stack decisions

| Layer | Choice | Why |
|---|---|---|
| Web | React 19, Vite, React Router 7, Tailwind v4, shadcn/ui | Fast SPA console; prerendered marketing routes for SEO |
| API | NestJS 11 with the Fastify adapter, TypeScript, Zod | Modules/guards/DI + low-overhead Fastify; Vercel-native |
| Data | PostgreSQL 17 + PostGIS + TimescaleDB, Prisma 7 | Relational tenancy + spatial + time-series in one engine; typed access |
| Cache/queue | Redis 7 (Upstash later), BullMQ | Latest-state cache, pub/sub fanout, retries, rate limits |
| Maps | MapLibre GL JS 6 + vector tiles | Open source, no token lock-in, GPU rendering |
| Auth | Better Auth + Prisma | TypeScript-native, own Postgres, organizations/sessions |
| Embed | Signed short-lived JWT + iframe + web component | Works in any host, read-only, origin-bound |
| Frontend host | Netlify | Static CDN, preview deploys, instant rollback |
| Backend host | Vercel Functions + Daemons | Managed API, native WebSockets, background worker |
| Database host | Neon later | Managed Postgres/PostGIS/Timescale, branching, PITR |

Full reasoning is in `project/03-architecture.md` and `project/04-adr/`.

## Setup (planned)

These commands become real in milestone M1. They are documented now so the plan is executable.

```bash
pnpm install
pnpm db:up
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

## Documentation

- `project/` — product truth: brief, discovery, PRD, catalog, architecture, ADRs, plan, specs, metrics.
- `docs/` — framework process playbooks (discovery, product, architecture, planning, quality, security, release).
- `AGENTS.md` — operating manual for AI agents.
- `.agents/skills/` — on-demand procedures.
- `.agents/templates/` — document templates.

## License

See `LICENSE`.
