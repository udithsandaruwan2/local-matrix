# T-011 — E2E, RLS isolation, and contract tests

- **Milestone:** M1
- **Feature:** none (quality gate)
- **Size:** M
- **Risk:** medium
- **Depends on:** T-008, T-009, T-010
- **Status:** todo

## Goal

The M1 demo is protected by an automated suite that proves the happy path, tenant isolation, the ingest contract, and live updates in CI and on preview deployments.

## Context

- `project/02-prd.md` — release criteria
- `project/03-architecture.md` — threat model
- `project/05-plan.md` — required checks

## Acceptance

- [ ] Playwright covers: signup → verify → create device → copy key → send point → marker appears → second tab sees the same state.
- [ ] An RLS suite seeds two workspaces and proves select/insert/update/delete isolation for every tenant table created in M1.
- [ ] An API-key suite proves revoked, expired, wrong-scope, and cross-workspace keys fail with the documented codes.
- [ ] Contract tests validate every documented response against the OpenAPI schema, including error shapes.
- [ ] Ingest tests cover single, batch partial failure, idempotent replay, oversized payload, and rate limit.
- [ ] WebSocket tests cover bad token, snapshot, delta, filter, reconnect at the Vercel lifetime limit, and multi-instance fan-out.
- [ ] Tests run against real Postgres/PostGIS/Timescale and Redis in CI (service containers), not mocks for the DB.
- [ ] The suite passes three consecutive runs with no retries to catch flakiness.
- [ ] CI blocks merge on E2E, RLS, or contract failure; failures upload traces and request IDs.
- [ ] A Netlify deploy preview and a Vercel preview pass the smoke and auth flows against a Neon preview branch.
- [ ] A short `project/07-runbook.md` section explains how to reproduce a failure locally.

## Out of scope

- Load testing (T-060), security review (T-061), embed and webhook tests (M3/M4).
- Visual regression snapshots.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @local-matrix/web exec playwright test
pnpm test:rls
pnpm test:contract
```

Manual: open the CI run and confirm all jobs are green and artifacts are attached.

## Notes

Prefer one realistic fixture over many mocks. Use a per-worker database schema or a truncate-between-tests helper; never share mutable tenant rows across parallel workers. Keep the E2E selector contract in `data-testid` attributes, not CSS classes. Preview tests need the Netlify origin in the API CORS allowlist.
