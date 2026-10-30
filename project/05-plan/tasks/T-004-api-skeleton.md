# T-004 — NestJS API skeleton: config, errors, health, OpenAPI

- **Milestone:** M1
- **Feature:** FEAT-030 (foundation)
- **Size:** M
- **Risk:** medium
- **Depends on:** T-001
- **Status:** todo

## Goal

A NestJS 11 API using the Fastify adapter that boots locally and on Vercel with validated configuration, structured logs, request IDs, RFC 7807 errors, health/readiness endpoints, CORS, rate limiting, OpenAPI generation, and graceful shutdown.

## Context

- `project/03-architecture.md` — contracts and observability
- `project/04-adr/0001-monorepo-react-nestjs.md` — API boundary and hosting
- `project/05-plan.md` — M1 S2

## Acceptance

- [ ] `apps/api` uses `NestFactory.create(AppModule, new FastifyAdapter())` and runs on `localhost:3001`.
- [ ] `GET /health` returns `200 {status:"ok", version, uptime}` without touching the DB.
- [ ] `GET /ready` checks Postgres (Prisma) and Redis and returns `503` with the failing dependency.
- [ ] Every error is `application/problem+json` with `type`, `title`, `status`, `detail`, `code`, `requestId`.
- [ ] Every response has `x-request-id`; pino logs include it and redact auth/cookies/coordinates.
- [ ] `GET /openapi.json` returns a valid OpenAPI 3.1 document; `GET /docs` renders Scalar.
- [ ] CORS uses an exact allowlist from env with credentials; unknown origins are rejected.
- [ ] Rate limiting is enabled with a documented override; storage is Redis in staging and memory locally.
- [ ] SIGTERM drains connections and closes Prisma/Redis clients.
- [ ] A Vercel entrypoint (`api/index.ts` or equivalent) exports the Fastify/Nest handler; `vercel dev` serves `/health`.
- [ ] Unit tests cover config validation and the error shape.

## Out of scope

- Domain routes, auth, WebSocket, database queries beyond readiness.
- Production deployment (T-012).

## Verification

```bash
pnpm --filter @local-matrix/api dev
curl -s localhost:3001/health
curl -s localhost:3001/ready
curl -s localhost:3001/openapi.json | jq .openapi
pnpm --filter @local-matrix/api test
pnpm typecheck
vercel dev --cwd apps/api
```

## Notes

Use `nestjs-zod` (or a single Zod validation pipe) so contracts stay in `packages/shared`. Keep the error mapper in one filter; do not let raw exceptions reach clients. Configure log redaction here, not later. Verify the Fastify adapter on Vercel before building domain routes.
