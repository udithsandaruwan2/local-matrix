# T-012 — Staging deploy on Netlify + Vercel + Neon

- **Milestone:** M1
- **Feature:** none (operations)
- **Size:** M
- **Risk:** medium
- **Depends on:** T-011
- **Status:** todo

## Goal

The M1 build runs on Netlify (web), Vercel (API + worker), and Neon (Postgres) with migrations, preview environments, health checks, a smoke script, and a tested rollback.

## Context

- `project/04-adr/0008-netlify-vercel-neon-deploy.md` — deployment model
- `project/07-runbook.md` — operations
- `project/05-plan.md` — M1 exit criteria

## Acceptance

- [ ] Netlify builds `apps/web` from the monorepo, serves the SPA with the correct redirects and cache headers, and exposes a deploy preview per PR.
- [ ] Vercel builds `apps/api` as a NestJS Function, serves `/health`, `/openapi.json`, `/docs`, and `WS /v1/stream` on a preview deployment.
- [ ] `GET /embed/:id` is routed on Vercel so it can set per-embed CSP headers.
- [ ] Neon staging project has PostGIS and Timescale enabled; `prisma migrate deploy` runs against `DIRECT_URL` from CI, not from the app build.
- [ ] Upstash Redis (or a staging Redis) is configured for rate limits, pub/sub, and BullMQ.
- [ ] The worker runs as a Vercel Daemon or the documented Railway fallback; queue depth and job failures are visible.
- [ ] Secrets live in Netlify/Vercel/Neon env vars; no secret is committed or baked into a client bundle.
- [ ] `scripts/smoke.sh` checks the home page, health, readiness, login, OpenAPI, ingest with a staging key, and WS handshake; it exits non-zero on failure.
- [ ] A pre-deploy Neon branch or backup is created; the restore command is documented and tested once.
- [ ] Rollback to the previous Netlify deploy and Vercel deployment is documented and executed once with a smoke pass.
- [ ] Production deploy is triggered only from `prod-frontend`/`prod-backend` after explicit human instruction; staging deploy never touches `prod-*`.
- [ ] `project/07-runbook.md` covers deploy, rollback, backup/restore, Neon connection limits, common failures, and log locations.

## Out of scope

- Production domain and DNS cutover (M6), autoscaling, multi-region, managed Redis migration.
- Full metrics/tracing stack (T-062).

## Verification

```bash
pnpm build
pnpm --filter @local-matrix/api exec vercel build
./scripts/smoke.sh https://staging.example.com
```

Manual: promote a Netlify deploy, promote a Vercel deployment, run smoke, then roll both back and run smoke again.

## Notes

Keep staging data disposable and seeded with demo data. Pin Neon and Upstash regions to the API region to avoid cross-region latency. Write the rollback steps before the first deploy, not after the first incident. Never run migrations from the Vercel build; CI owns the migration step.
