# Tasks

One task per file: `T-###-<slug>.md`. Use `.agents/templates/task.md`.

Rules:

- Size S/M/L only. No XL.
- Every task has acceptance, verification, and dependencies.
- One task per branch and per agent worktree.
- Update status here and in `project/STATE.md`.

## Index

| ID | Task | Size | Depends | Status |
|---|---|---|---|---|
| [T-001](T-001-monorepo-scaffold.md) | Monorepo scaffold + tooling + CI | M | — | todo |
| [T-002](T-002-local-infra.md) | Local infra: Postgres/PostGIS/Timescale + Redis | M | T-001 | todo |
| [T-003](T-003-schema-rls.md) | Schema, hypertable, indexes, RLS | L | T-002 | todo |
| [T-004](T-004-api-skeleton.md) | API skeleton: config, errors, health, OpenAPI | M | T-001 | todo |
| [T-005](T-005-devices-api-keys.md) | Devices + API keys + auth guards | M | T-003, T-004 | todo |
| [T-006](T-006-ingest-api.md) | Ingest API single + batch + idempotency | L | T-003, T-005 | todo |
| [T-007](T-007-websocket-stream.md) | WebSocket stream + Redis fan-out | L | T-006 | todo |
| [T-008](T-008-live-map-ui.md) | Live map UI + device drawer | L | T-007 | todo |
| [T-009](T-009-auth-workspace.md) | Auth + workspace + route protection | L | T-003 | todo |
| [T-010](T-010-onboarding-simulator.md) | Onboarding checklist + demo simulator | M | T-008, T-009 | todo |
| [T-011](T-011-e2e-rls-contract.md) | E2E + RLS isolation + contract tests | M | T-008, T-009, T-010 | todo |
| [T-012](T-012-staging-deploy.md) | Staging deploy on Netlify + Vercel + Neon | M | T-011 | todo |

Later milestones (`T-020`–`T-065`) are listed in `project/05-plan.md` and will be written as task files when their milestone starts.
