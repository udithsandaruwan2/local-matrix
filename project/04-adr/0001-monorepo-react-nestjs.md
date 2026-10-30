# ADR-0001 — Monorepo with React/Vite web, NestJS API, worker, and embed app

- **Status:** accepted (revised 2026-10-30 before G3 approval)
- **Date:** 2026-10-30
- **Deciders:** Udith Sandaruwan
- **Supersedes:** none

## Context

Local Matrix has four runtime surfaces: a public marketing site and authenticated console, a telemetry API, a background worker, and an embeddable map runtime. They share contracts, types, design tokens, and domain rules. The team is one builder plus an AI agent, so duplicated configuration and cross-repo version skew are expensive.

The owner has fixed the stack: React + Vite on Netlify for the frontend, NestJS with the Fastify adapter on Vercel for the backend, and PostgreSQL + Prisma 7 locally on Docker with Neon later. Next.js, Hono, and Drizzle are explicitly out of scope.

## Decision

Use a single pnpm workspace with Turborepo:

- `apps/web` — React 19 + Vite 7 + React Router 7 + Tailwind v4: public site, auth UI, console. Deployed to Netlify as static assets with build-time prerendering for marketing routes.
- `apps/api` — NestJS 11 with the Fastify adapter: REST ingest/query, API-key and session auth, OpenAPI, WebSocket gateway. Deployed as a Vercel Function on Fluid compute.
- `apps/worker` — NestJS standalone + BullMQ: alerts, geofence transitions, webhooks, retention, rollups. Runs as a Vercel Daemon (public beta) or any container host; local Docker during development.
- `apps/embed` — Vite + React + MapLibre: iframe runtime and `embed.js` web component. Static assets on Netlify; the HTML shell is served by the API so CSP `frame-ancestors` can be generated per embed.
- `packages/db` (Prisma 7 schema, SQL migrations, RLS), `core` (domain logic), `shared` (Zod contracts), `map` (MapLibre components), `ui` (design system), `config` (tooling).

The frontend and API are separate deployables because they have different hosting models, scaling behavior, and release cadences. The worker is separate because serverless request functions must not run long-lived queue consumers.

## Alternatives

| Option | Why not chosen |
|---|---|
| Next.js full-stack | Owner constraint; also couples marketing, console, and API to one runtime and deployment model |
| Single Vite SPA with API routes | Vercel Functions and Netlify static hosting already separate the concerns cleanly |
| Hono API | Owner constraint; NestJS provides modules, guards, DI, and OpenAPI structure for a growing API |
| Express adapter for NestJS | Fastify is faster, has first-class schema validation, and is the owner's choice |
| Separate repositories | Contract drift, duplicated tooling, slower solo development |

## Consequences

**Positive**
- One install, one lockfile, one lint/typecheck/test pipeline.
- Shared Zod contracts prevent API/UI drift.
- Netlify and Vercel deploy independently; previews map to the surface that changed.
- Vite keeps the console bundle small and the dev server fast.

**Negative**
- Two hosting providers, two sets of environment variables, and cross-site cookie/CORS configuration.
- Vercel Functions have cold starts and execution limits; WebSocket connections close at the function duration limit.
- Vercel Daemons are public beta; the worker needs a container fallback.
- Marketing SEO depends on build-time prerendering rather than server rendering.

**Neutral**
- The API can later move to a container host without changing contracts.

## Revisit if

- Vercel WebSocket limits or Daemon beta terms become unacceptable.
- The team grows beyond five engineers and ownership boundaries become unclear.
- Build times exceed 10 minutes despite caching.

## References

- `project/03-architecture.md`
- `project/05-plan.md` M1
