---
project: "Local Matrix"
phase: 5-build
phase_name: "Build"
status: building
updated: "2026-10-30"
owner: "Udith Sandaruwan"
gates:
  G0: approved
  G1: approved
  G2: approved
  G3: approved
  G4: approved
  G5: pending
  G6: pending
next_action: "Build M1: T-003 (Prisma schema, hypertable, RLS, withWorkspace helper) via feature branch from dev-backend."
---

# Project state

> Single source of truth for **where we are**. Agents read this first. Keep it under one screen.

## Current focus

Planning is complete and awaiting human approval. The stack is now React/Vite on Netlify, NestJS/Fastify on Vercel, and PostgreSQL + Prisma 7 with Docker locally and Neon later. M1 is sliced into T-001–T-012, the three contract specs are written, and the branch model is documented. No product code exists yet.

## Gate log

| Gate | Status | Date | Approved by | Notes |
|---|---|---|---|---|
| G0 Brief | proposed | 2026-10-30 | — | `00-brief.md` |
| G1 Discovery | proposed | 2026-10-30 | — | `01-discovery.md` |
| G2 Product | proposed | 2026-10-30 | — | `02-prd.md`, `02-product-catalog.md` |
| G3 Architecture | proposed | 2026-10-30 | — | `03-architecture.md`, ADR-0001–0009 |
| G4 Plan / build | pending | — | — | `05-plan.md`, task files T-001–T-012 |
| G5 Merge | pending | — | — | |
| G6 Release | pending | — | — | |

## Blockers

- None currently. Branches exist and are protected; `pnpm install` is reproducible via the committed lockfile (locally run as `npx pnpm@10.34.9` because global pnpm is not on PATH).

## Recent decisions

| Date | Decision | ADR |
|---|---|---|
| 2026-10-30 | pnpm monorepo with React/Vite web, NestJS/Fastify API, worker, embed app | [0001](04-adr/0001-monorepo-react-nestjs.md) |
| 2026-10-30 | PostgreSQL 17 + PostGIS + TimescaleDB with Prisma 7 | [0002](04-adr/0002-postgres-postgis-prisma.md) |
| 2026-10-30 | MapLibre GL JS with vector tiles | [0003](04-adr/0003-maplibre-vector-tiles.md) |
| 2026-10-30 | Custom WebSocket gateway + Redis pub/sub | [0004](04-adr/0004-websocket-redis-fanout.md) |
| 2026-10-30 | `workspace_id` + forced RLS, no service role in request path | [0005](04-adr/0005-tenant-isolation-rls.md) |
| 2026-10-30 | Signed short-lived embed tokens + iframe/web component | [0006](04-adr/0006-embed-token-model.md) |
| 2026-10-30 | Better Auth for sessions and organizations | [0007](04-adr/0007-better-auth.md) |
| 2026-10-30 | Netlify + Vercel + Neon for v1; Docker local only | [0008](04-adr/0008-netlify-vercel-neon-deploy.md) |
| 2026-10-30 | Five long-lived branches: `main`, `dev-frontend`, `dev-backend`, `prod-frontend`, `prod-backend`; production deploy is human-gated | [Git workflow](../docs/07-git-workflow.md) |
| 2026-10-30 | Canonical telemetry envelope with JSONB sensors | [0009](04-adr/0009-canonical-telemetry-schema.md) |

## Next action

See `next_action` in the frontmatter. Update both together when the action changes.

## Links

- Brief: `00-brief.md`
- PRD: `02-prd.md`
- Catalog: `02-product-catalog.md`
- Architecture: `03-architecture.md`
- Plan: `05-plan.md`
- Specs: `06-specs/`
- Runbook: `07-runbook.md`
- Metrics: `08-metrics.md`
- Handoffs: `handoffs/`

## Rules for updating this file

- Update at every phase change, gate approval, blocker, and handoff.
- Keep the body short; detail belongs in the artifact.
- The YAML frontmatter is machine-readable; keep keys stable.
- Never mark a gate `approved` without human approval.