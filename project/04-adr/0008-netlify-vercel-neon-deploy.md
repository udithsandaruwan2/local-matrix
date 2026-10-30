# ADR-0008 — Netlify + Vercel + Neon for v1

- **Status:** accepted (revised 2026-10-30 before G3 approval)
- **Date:** 2026-10-30
- **Deciders:** Udith Sandaruwan
- **Supersedes:** none

## Context

V1 needs a public web app, an authenticated console, an API with WebSockets, a worker, PostgreSQL/PostGIS/Timescale, Redis, and an embeddable map runtime. The budget is under $150/month, the team is one builder, and the product has not proven demand. The owner has fixed Netlify for the frontend, Vercel for the backend, and PostgreSQL + Prisma with Docker locally and Neon later.

## Decision

Deploy each surface to the platform that fits its runtime:

- **Netlify** — `apps/web` static Vite build at `app.localmatrix.dev` and the apex marketing site; `apps/embed` static assets at `embed.localmatrix.dev`. SPA redirects, immutable asset caching, preview deploys per PR.
- **Vercel** — `apps/api` as a NestJS Function on Fluid compute at `api.localmatrix.dev`; `GET /embed/:id` HTML shell for dynamic CSP; `apps/worker` as a Vercel Daemon (public beta) running the BullMQ consumer. A container on Railway/Fly is the fallback if Daemon terms or limits block v1.
- **Neon** — managed PostgreSQL 17 with PostGIS and TimescaleDB (Apache-2 features) for staging/production after the local Docker phase; pooled `DATABASE_URL` for runtime, `DIRECT_URL` for migrations.
- **Upstash Redis** — rate limits, stream fan-out, BullMQ, idempotency cache; local Docker Redis in development.
- **MapTiler** — production vector tiles; **Resend** — transactional email.
- **Docker Compose** — local Postgres/PostGIS/Timescale, Redis, and Mailpit only. No Caddy, no production containers in v1.

Migrations run from CI (GitHub Actions) against `DIRECT_URL`, never from the Vercel build. A failed migration stops the release. Deploys are immutable: Netlify deploy ID and Vercel deployment ID are recorded in the release notes.

Backups: Neon point-in-time restore plus a nightly logical dump to object storage; restore drill in M6. Rollback: Netlify instant rollback and Vercel "promote previous deployment"; migrations are forward-only, so take a backup before release.

## Alternatives

| Option | Why not chosen |
|---|---|
| Docker Compose + Caddy on one VPS | Lowest fixed cost, but the owner chose managed frontend/backend hosting; we would own OS, TLS, and backups |
| Cloudflare Workers + Durable Objects | Excellent edge model, but Postgres access, Node worker, and NestJS are a poor fit |
| Kubernetes | Operationally heavy for one builder and unproven traffic |
| Vercel for the frontend too | Possible, but the owner chose Netlify and static Vite hosting is a clean fit |
| Neon from day one | Local Docker keeps development offline and migrations fast; Neon is the staging/production target |

## Consequences

**Positive**
- No servers to patch; TLS, CDN, and previews are managed.
- Frontend and API scale independently.
- Neon branching gives preview databases and fast restore.
- Local development stays fully offline with Docker.

**Negative**
- Two hosting dashboards, two sets of secrets, and cross-origin cookie/CORS configuration.
- Vercel Function duration limits bound WebSocket connections; clients must reconnect.
- Vercel Daemons are public beta; the worker may need a container host.
- Neon does not support Timescale compression; 90-day raw retention costs more there.
- Netlify static hosting cannot set per-embed CSP without an edge function, so the embed HTML shell is served by Vercel.
- Vendor sprawl: Netlify, Vercel, Neon, Upstash, MapTiler, Resend.

**Neutral**
- The API and worker can move to a container host without changing contracts.

## Revisit if

- Vercel WebSocket or Daemon limits become unacceptable.
- Neon storage cost exceeds the budget at target retention.
- A customer requires a single-region data residency or a private deployment.
- Ops time across providers exceeds one day per week.

## References

- `project/03-architecture.md` failure modes
- `project/07-runbook.md`
- `project/05-plan.md` T-012
