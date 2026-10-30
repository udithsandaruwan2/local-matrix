# Architecture

> Phase 3 · Gate G3 · Draft for human review. Decisions and boundaries, not an encyclopedia.

## Context

Local Matrix is a multi-tenant SaaS that ingests GPS and sensor telemetry, stores history, streams live positions, and distributes data through APIs, webhooks, and embeddable maps. The v1 design target is **10,000 devices, 100 events/s sustained, 1,000 concurrent map viewers, and 5,000 markers per map**, with 90 days of raw history on the Pro plan. The system must be cheap enough to run under $150/month before revenue, while keeping a clear path to 10×.

The stack is fixed by the owner: React + Vite + TypeScript + Tailwind on Netlify, NestJS with the Fastify adapter on Vercel, and PostgreSQL + Prisma 7 locally on Docker with Neon later.

## Constraints

| Constraint | Value | Source |
|---|---|---|
| Devices (v1) | 10,000 | PRD / estimate |
| Sustained ingest | 100 events/s; burst 1,000/s | PRD / estimate |
| Concurrent viewers | 1,000 | PRD / estimate |
| Markers per map | 5,000 | NFR-003 |
| Live latency | p95 < 1.5 s | NFR-002 |
| Ingest latency | p95 < 100 ms | NFR-001 |
| Query latency | 24 h track p95 < 500 ms | NFR-004 |
| Raw retention | 90 days Pro; 7 days Free | NFR-010 |
| Availability | 99.9% monthly | NFR-005 |
| Data class | Sensitive (location, telemetry, account) | AGENTS.md |
| Budget | < $150/month | Brief |
| Team | 1 builder + AI agent | Brief |
| Region | EU, single region | Open question Q3 |

Unknowns that block decisions:

- Neon plan/region and whether Timescale compression is needed at target retention.
- Vercel Daemon availability for the worker after public beta.
- Tile provider contract — blocks production map styling, not development.
- Email provider — blocks alert email in M3.

## System shape

```text
  Devices / apps / gateways
         │ HTTPS ingest                 │ MQTT (Should, M2)
         ▼                              ▼
  ┌──────────────────────────────────────────────┐
  │ Vercel Function — NestJS + Fastify           │
  │  REST ingest · query · auth · OpenAPI        │
  │  WebSocket gateway · stream tokens           │
  │  Embed HTML shell (dynamic CSP)              │
  └───────┬───────────────────┬──────────────────┘
          │                   │
          ▼                   ▼
  ┌───────────────┐   ┌──────────────────────────┐
  │ Neon / Docker │   │ Upstash / Docker Redis   │
  │ PostgreSQL 17 │   │ latest state · pub/sub   │
  │ PostGIS       │   │ rate limits · BullMQ     │
  │ Timescale     │   └────────────┬─────────────┘
  │ Prisma 7      │                │
  └───────┬───────┘   ┌────────────▼─────────────┐
          │           │ Vercel Daemon (beta)     │
          │           │ NestJS worker · BullMQ   │
          │           │ alerts · webhooks        │
          │           │ geofence · retention     │
          │           └──────────────────────────┘
          │
          ▼
  ┌──────────────────────────────────────────────┐
  │ Netlify                                      │
  │  React + Vite: marketing, auth, console      │
  │  Vite embed assets + embed.js                │
  └──────────────────────────────────────────────┘
```

The live path and the durable path are deliberately separate:

- **Durable path:** ingest → validate → Postgres (telemetry hypertable + `device_latest`).
- **Live path:** ingest → Redis latest + pub/sub → WebSocket fan-out.
- A Redis outage must not lose data; a Postgres outage must not silently accept data.

## Component responsibilities

| Component | Responsibility | Owns data? | Exit path |
|---|---|---|---|
| `apps/web` | Public site, auth UI, console, docs. Static Vite SPA with build-time prerender for marketing. | No | Any static host; Netlify is the chosen one |
| `apps/api` | NestJS + Fastify REST ingest/query, auth guards, OpenAPI, WebSocket gateway, embed HTML shell | No (delegates to packages) | Container host if Vercel limits bind |
| `apps/worker` | Alert evaluation, geofence transitions, webhook delivery, retention, rollups | No | Vercel Daemon → Railway/Fly container |
| `apps/embed` | Read-only live map, iframe runtime, `embed.js` web component, postMessage | No | Static app; Netlify CDN |
| `packages/db` | Prisma 7 schema, SQL migrations, RLS policies, tenant transaction helper | Yes (schema) | Postgres-compatible managed service |
| `packages/core` | Normalization, geofence math, alert evaluator, downsampling | No | Pure TypeScript; portable |
| `packages/shared` | Zod contracts, event types, error codes, constants | No | Versioned package |
| `packages/map` | MapLibre React components, style, layer helpers | No | MapLibre/Mapbox abstraction |
| `packages/ui` | shadcn/ui components, design tokens, chart wrappers | No | Copy-in components |
| `packages/config` | TypeScript, ESLint, Vitest, Playwright, Tailwind config | No | — |

## Options considered

| Decision | Option A | Option B | Option C | Choice | ADR |
|---|---|---|---|---|---|
| Web app | React + Vite + React Router | Next.js | Remix | React + Vite | 0001 |
| API | NestJS + Fastify adapter | Fastify standalone | Hono | NestJS + Fastify | 0001 |
| Primary store | Postgres + PostGIS + Timescale + Prisma 7 | Postgres + ClickHouse | QuestDB + PostGIS | Postgres + PostGIS + Timescale + Prisma | 0002 |
| Realtime | Vercel WS + Redis pub/sub | Ably | Centrifugo | Vercel WS + Redis | 0004 |
| Maps | MapLibre GL JS 6 | Mapbox GL JS | Leaflet | MapLibre | 0003 |
| Auth | Better Auth + Prisma | Clerk | Auth.js | Better Auth | 0007 |
| Embed | iframe + web component | iframe only | JS SDK only | iframe + web component | 0006 |
| Deploy | Netlify + Vercel + Neon | Docker Compose + VPS | Cloudflare Workers + DO | Netlify + Vercel + Neon | 0008 |
| Worker | Vercel Daemon + BullMQ | Railway/Fly container | Inngest | Vercel Daemon, container fallback | 0008 |

### Why React + Vite on Netlify

The console is an authenticated dashboard, not an SEO surface. A Vite SPA keeps the bundle small, the dev loop fast, and deployment static. Marketing routes are prerendered at build time for SEO and OG tags. Netlify gives immutable asset caching, preview deploys, and instant rollback without running a Node server.

### Why NestJS + Fastify on Vercel

NestJS provides the module, guard, pipe, and OpenAPI structure a growing telemetry API needs. The Fastify adapter keeps request overhead low and aligns with Fastify's schema validation. Vercel Functions give managed TLS, previews, Fluid compute, and native WebSockets (GA October 2026). The trade-off is cold starts and a 300–800 s WebSocket lifetime, which the client handles with reconnect and resync.

### Why Postgres + PostGIS + Timescale with Prisma 7

At 100 events/s (≈8.6M points/day), one Postgres instance with a Timescale hypertable is comfortably within range. PostGIS provides geofence and spatial queries; Timescale provides chunking, continuous aggregates, and retention. Prisma 7 gives typed access for the relational core and a single migration history; hypertables, partitions, and RLS stay in hand-written SQL. Neon supports PostGIS and Apache-2 Timescale features, but not compression, so 90-day raw retention is monitored and Timescale Cloud is the exit path if storage cost binds.

### Why Vercel WebSockets + Redis

The API already owns ingest, auth, and tenant context. A WebSocket gateway in the same deployable avoids a second stateful service and a second auth model. Redis pub/sub handles fan-out across function instances, and the client already needs reconnect logic because connections close at the function duration limit. At >5,000 connections or >500 events/s fan-out, move to Ably/Centrifugo without changing the event contract.

## Boundaries

| Module | Responsibility | Interface | Owner |
|---|---|---|---|
| Identity | Users, sessions, workspaces, roles | Better Auth + `members` | Platform |
| Devices | Device registry and latest state | `devices` service | Platform |
| Ingest | Validate, normalize, persist, publish | `POST /v1/ingest` | Platform |
| Query | Devices, latest, track, series, alerts | `GET /v1/*` | Platform |
| Stream | Snapshot + deltas over WebSocket | `WS /v1/stream` | Platform |
| Rules | Geofences, alert rules, evaluation | Worker jobs | Product |
| Distribution | Webhooks, share links, embeds | `/v1/webhooks`, `/v1/embeds` | Platform |
| Presentation | Console, home, docs, embed UI | React components | Product |

Dependency rule: `apps → packages/core → packages/db / packages/shared`. UI never imports `packages/db`; API never imports `apps/web`. `packages/shared` has no runtime dependencies on other workspace packages.

## Data model

```text
Workspace 1—* Member *—1 User
Workspace 1—* Device 1—* Telemetry
Workspace 1—* ApiKey
Workspace 1—* Geofence 1—* GeofenceEvent
Workspace 1—* AlertRule 1—* Alert
Workspace 1—* WebhookEndpoint 1—* WebhookDelivery
Workspace 1—* Embed
Workspace 1—* Dashboard
Workspace 1—* AuditLog
```

### Core tables

| Table | Key fields | Notes |
|---|---|---|
| `workspaces` | `id`, `name`, `slug`, `plan`, `retention_days`, `created_at` | Tenant root |
| `users` | `id`, `email`, `name`, `email_verified` | Better Auth-owned, Prisma model |
| `members` | `workspace_id`, `user_id`, `role` | Unique `(workspace_id, user_id)`; roles owner/admin/operator/viewer |
| `devices` | `id`, `workspace_id`, `external_id`, `name`, `type`, `group`, `metadata`, `status`, `last_seen_at` | Unique `(workspace_id, external_id)` |
| `api_keys` | `id`, `workspace_id`, `name`, `prefix`, `key_hash`, `scopes`, `last_used_at`, `revoked_at` | Never store plaintext |
| `telemetry` | `workspace_id`, `device_id`, `ts`, `geom`, `lat`, `lng`, `altitude`, `speed`, `heading`, `accuracy`, `sensors`, `tags`, `source`, `idempotency_key` | Timescale hypertable on `ts`; GiST on `geom`; hand-written SQL |
| `device_latest` | `device_id` PK, `workspace_id`, `ts`, `geom`, `speed`, `heading`, `sensors`, `status` | Upsert on ingest; Redis cache in front |
| `geofences` | `id`, `workspace_id`, `name`, `geom`, `color`, `metadata` | `geography(Polygon, 4326)`; GiST index |
| `geofence_events` | `id`, `workspace_id`, `device_id`, `geofence_id`, `type`, `ts` | Unique transition guard |
| `alert_rules` | `id`, `workspace_id`, `name`, `type`, `config`, `severity`, `enabled`, `cooldown_s` | Type: speed/offline/sensor/geofence |
| `alerts` | `id`, `workspace_id`, `device_id`, `rule_id`, `type`, `severity`, `status`, `triggered_at`, `resolved_at`, `details` | Status: open/ack/resolved |
| `webhook_endpoints` | `id`, `workspace_id`, `url`, `secret_hash`, `events`, `enabled` | HTTPS only; SSRF checks |
| `webhook_deliveries` | `id`, `endpoint_id`, `event_id`, `status`, `attempts`, `response_code`, `next_retry_at` | Dead-letter after 8 attempts |
| `embeds` | `id`, `workspace_id`, `name`, `config`, `allowed_origins`, `secret_hash`, `revoked_at` | Config: devices/groups/layers/theme |
| `dashboards` | `id`, `workspace_id`, `user_id`, `name`, `layout`, `is_default` | Layout JSON |
| `audit_log` | `id`, `workspace_id`, `actor_id`, `action`, `target`, `metadata`, `ip`, `created_at` | Append-only |

### Invariants

- Every tenant-owned row has `workspace_id NOT NULL` and a foreign key to `workspaces(id)`.
- A device belongs to exactly one workspace; an embed belongs to exactly one workspace.
- `telemetry` is append-only. Corrections are new points, not updates.
- `device_latest` has exactly one row per device and is updated in the same transaction as the telemetry insert.
- Alert cooldown prevents more than one open alert per `(rule, device)` within the cooldown window.
- Embed tokens never carry write scopes.
- API keys are hashed with SHA-256 + server pepper; only the prefix is stored in plaintext.
- Soft delete for devices, embeds, and workspaces; telemetry is purged by retention.
- Tenant queries run only through `PrismaService.withWorkspace`; raw SQL must use the same transaction.

### Lifecycle

- **Ingest:** validate → normalize → insert telemetry → upsert latest → publish Redis → enqueue rule evaluation.
- **Device:** active → stale (no point in 2× expected interval) → offline; archive is soft delete.
- **Alert:** open → acknowledged → resolved; auto-resolve when the condition clears.
- **Embed:** active → revoked; revocation takes effect on the next token check.
- **Workspace:** active → soft-deleted (30 days) → purged.

### Retention and migration

- Free: 7 days raw, 30 days aggregates. Pro: 90 days raw, 1 year aggregates. Enterprise: custom.
- Timescale compression after 7 days where supported; retention policy per plan; continuous aggregates `telemetry_1m` and `telemetry_1h`.
- Neon does not support Timescale compression; storage is monitored and the exit path is Timescale Cloud or a colder raw tier.
- Migrations are Prisma Migrate plus hand-written SQL: expand → migrate → contract. Never edit an applied migration.
- CI runs `prisma migrate deploy` against `DIRECT_URL`; the runtime uses the pooled `DATABASE_URL`.

## Contracts

| Interface | Input | Output | Errors | Auth |
|---|---|---|---|---|
| `POST /v1/ingest` | `TelemetryPoint` JSON | `202 {accepted, rejected, ids}` | 400/401/403/422/429 | API key `ingest:write` |
| `POST /v1/ingest/batch` | `{points: TelemetryPoint[]}` ≤1,000 | `202 {accepted, rejected, errors[]}` | 400/401/403/413/422/429 | API key `ingest:write` |
| `GET /v1/devices` | filters, cursor | device page | 401/403 | session or `devices:read` |
| `GET /v1/devices/:id/latest` | — | latest point + status | 404 | session or `query:read` |
| `GET /v1/devices/:id/track` | `from`, `to`, `limit` | GeoJSON LineString + points | 400/404 | session or `query:read` |
| `GET /v1/devices/:id/series` | `metric`, `from`, `to`, `interval` | bucketed values | 400/404 | session or `query:read` |
| `GET /v1/alerts` | status, severity, cursor | alert page | 401/403 | session or `query:read` |
| `POST /v1/stream-token` | scope, device filter | short-lived JWT | 401/403 | session or embed token |
| `WS /v1/stream` | token, subscribe/resume | snapshot + deltas | 401/403/429 | stream token |
| `POST /v1/embeds/:id/token` | origin, ttl, filters | signed JWT | 401/403/404 | workspace API key `embeds:manage` |
| `GET /embed/:embedId` | token | HTML shell + CSP | 401/403/410 | embed token |
| `POST /v1/webhooks` | url, events, secret | endpoint | 400/401/422 | session or `webhooks:manage` |

All errors use RFC 7807 `application/problem+json` with `type`, `title`, `status`, `detail`, `code`, `requestId`, and optional `errors[]`.

WebSocket connections are bounded by the Vercel function duration (300 s Hobby, 800 s Pro). The client reconnects before the limit and resumes with `since`; the server returns a fresh snapshot if the gap is too large.

## Threat model

| Threat | Mitigation | Test |
|---|---|---|
| Spoofed device | Per-device API key or workspace key + optional device HMAC; rate limits | Auth integration test |
| Replay / duplicate points | `Idempotency-Key`, timestamp skew window, unique dedupe key | Ingest idempotency test |
| Cross-tenant leak | `workspace_id` + RLS + `app.workspace_id` per transaction; no service-role in request path | RLS isolation suite |
| Cross-site session theft | HTTP-only secure cookie, `SameSite=Lax`, exact CORS allowlist, CSRF on mutations | Auth E2E on staging |
| Embed token theft | ≤1 h TTL, origin allowlist, read-only scopes, revocation, per-embed rate limit | Embed security test |
| Embed framing by a hostile site | Per-embed CSP `frame-ancestors`, no wildcard | CSP test |
| Webhook forgery | HMAC-SHA256 over timestamp + body; 5-minute replay window | Signature test |
| SSRF via webhook URL | HTTPS only; resolve DNS and block private/link-local/metadata ranges; no redirects | SSRF test |
| DoS / cost abuse | Per-key and per-IP rate limits, payload caps, workspace quotas, backpressure | k6 abuse test |
| XSS in map/device labels | Render as text; no raw HTML; CSP | UI test + CSP report |
| Secret leakage | Vercel/Netlify env vars; redact auth headers and keys; no coordinates at info level | Log review |
| Neon connection exhaustion | Pooled `DATABASE_URL`, Prisma adapter pool, `attachDatabasePool` on Vercel, query timeouts | Load test |
| Supply-chain compromise | Lockfile, pinned images, `pnpm audit`, Dependabot | CI |
| Prompt injection via device metadata | Treat all device data as data; no agent tools in request path | Review |

## Observability

- **Logs:** pino JSON with `requestId`, `workspaceId`, `route`, `status`, `latencyMs`; redact `authorization`, `cookie`, API keys, and raw coordinates. Vercel and Netlify log drains to one sink.
- **Metrics:** ingest rate/latency/errors, validation failures, WS connections/reconnects, fan-out latency, DB query latency, queue depth, webhook success/failure, alert evaluation time, embed renders.
- **Traces:** API request → DB insert → Redis publish; worker job → webhook delivery. OpenTelemetry across Vercel Functions, Daemon, and Neon.
- **Alerts:** ingest error rate >1% for 5 min; WS reconnect rate >20%; DB p95 >500 ms; queue depth >1,000; webhook failure >10%; Neon storage >80%; certificate expiry <14 days.
- **Dashboards:** Grafana or Vercel Observability — platform health, ingest, realtime, database, queues, business funnel.

## Failure modes

| Failure | Impact | Detection | Response |
|---|---|---|---|
| Postgres/Neon down | Ingest fails; history unavailable | Health check + error rate | 503 + `Retry-After`; serve latest from Redis if fresh; page on-call |
| Neon connection limit | Requests queue or fail | Pool metrics + 5xx | Lower pool size; enable `attachDatabasePool`; scale plan |
| Redis/Upstash down | Live updates stop; queues pause | Health check + WS errors | Ingest still writes DB; UI falls back to 5 s polling; queues drain later |
| Worker Daemon down | Alerts/webhooks delayed | Queue depth + heartbeat | Restart; backlog drains; alerts still stored on next run |
| WebSocket closes at function limit | Live map pauses briefly | Client state + reconnect metric | Reconnect with `since`; snapshot resync |
| Vercel cold start | First request slow | p95 + trace | Keep bundle small; Fluid compute; warm critical routes |
| Netlify deploy bad | Console/marketing broken | Synthetic check | Instant rollback to previous deploy |
| Tile provider down | Map blank | Synthetic map check | Fallback style/tiles; cached style |
| Webhook endpoint down | Customer misses events | Delivery failures | Retry with backoff; dead-letter; console warning |
| Embed token expired | Embed stops | Embed error event | Refresh token from host; friendly state |
| MapLibre crash | Map unusable | Error boundary | Reload map; report to Sentry |
| Neon storage >80% | Writes fail | Storage alert | Retention/rollups; Timescale Cloud exit; expand plan |

## Decisions

- [ADR-0001](04-adr/0001-monorepo-react-nestjs.md) — monorepo with React/Vite web, NestJS API, worker, embed app.
- [ADR-0002](04-adr/0002-postgres-postgis-prisma.md) — Postgres + PostGIS + TimescaleDB with Prisma 7.
- [ADR-0003](04-adr/0003-maplibre-vector-tiles.md) — MapLibre GL JS + vector tiles.
- [ADR-0004](04-adr/0004-websocket-redis-fanout.md) — WebSocket gateway on Vercel + Redis pub/sub.
- [ADR-0005](04-adr/0005-tenant-isolation-rls.md) — workspace_id + Postgres RLS.
- [ADR-0006](04-adr/0006-embed-token-model.md) — signed short-lived embed tokens + iframe/web component.
- [ADR-0007](04-adr/0007-better-auth.md) — Better Auth with Prisma and NestJS.
- [ADR-0008](04-adr/0008-netlify-vercel-neon-deploy.md) — Netlify + Vercel + Neon for v1.
- [ADR-0009](04-adr/0009-canonical-telemetry-schema.md) — canonical telemetry with JSONB sensors.

## Open questions

| # | Question | Blocks | Default |
|---|---|---|---|
| Q1 | MQTT broker: Mosquitto vs EMQX? | M2 MQTT bridge | Mosquitto for v1; EMQX when clustering |
| Q2 | Tile provider: MapTiler vs Protomaps? | Production map style | MapTiler for speed; Protomaps as self-host exit |
| Q3 | Neon plan/region and compression need? | Staging/production DB | Neon Launch in EU; monitor storage, Timescale Cloud exit |
| Q4 | Email provider: Resend vs Postmark? | M3 alerts | Resend |
| Q5 | Object storage: S3 vs Cloudflare R2? | CSV exports/backups | R2 |
| Q6 | Worker host if Vercel Daemons fail? | M3 background jobs | Railway container with the same image |

**Approved by:** `<human>` on `<date>`
