# T-002 — Local infrastructure: Postgres/PostGIS/Timescale and Redis

- **Milestone:** M1
- **Feature:** none (foundation)
- **Size:** M
- **Risk:** low
- **Depends on:** T-001
- **Status:** done

## Goal

`pnpm db:up` starts a local PostgreSQL 17 instance with PostGIS and TimescaleDB, Redis 7, and Mailpit, with healthchecks, persistent volumes, and documented connection strings that mirror Neon/Upstash.

## Context

- `project/04-adr/0002-postgres-postgis-prisma.md` — database choice
- `project/04-adr/0008-netlify-vercel-neon-deploy.md` — deployment shape
- `project/03-architecture.md` — system shape

## Acceptance

- [ ] `infra/docker/compose.dev.yml` defines `postgres` (PostGIS + Timescale), `redis`, and `mailpit` with healthchecks and named volumes.
- [ ] `pnpm db:up`, `pnpm db:down`, `pnpm db:reset` work from the repo root.
- [ ] `SELECT postgis_version();` and `SELECT extversion FROM pg_extension WHERE extname = 'timescaledb';` return versions.
- [ ] `redis-cli ping` returns `PONG`; Mailpit UI is reachable on `localhost:8025`.
- [ ] Data survives `db:down`/`db:up`; `db:reset` removes volumes.
- [ ] Ports bind to `127.0.0.1` by default; credentials come from `.env`, not hardcoded.
- [ ] `.env.example` lists `DATABASE_URL` (pooled), `DIRECT_URL` (migrations), `REDIS_URL`, `SMTP_URL`, and local-only defaults.
- [ ] The local Timescale version is documented against the Neon-supported version; the schema avoids compression-only features.

## Out of scope

- Production Compose, TLS, backups, MQTT broker, Neon provisioning.

## Verification

```bash
pnpm db:up
docker compose -f infra/docker/compose.dev.yml ps
psql "$DIRECT_URL" -c "SELECT postgis_version();"
psql "$DIRECT_URL" -c "SELECT extname, extversion FROM pg_extension;"
redis-cli -u "$REDIS_URL" ping
pnpm db:down
pnpm db:up
```

## Notes

Use a pinned `timescale/timescaledb-ha:pg17` image or a small derived image if the combined tag is stale. Pin image tags; do not use `latest`. Keep `DATABASE_URL` and `DIRECT_URL` identical locally but separate on Neon.

## Delivery notes (2026-10-30)

- All acceptance items verified live. `db:reset` confirms volume removal (`local-matrix-dev_pgdata` gone); data persists across `db:down`/`db:up`.
- Host port 5432 is occupied on this dev machine by an unrelated native service, so the container publishes `127.0.0.1:15432:5432` — `.env.example` URLs use that port. On a clean machine `15432` stays consistent; do not assume 5432.
- PostGIS 3.6 must be created per database (`CREATE EXTENSION postgis`) — the HA image ships the binaries but does not create the extension; T-003's first migration does this.
- Image pins verified against the registry: `timescale/timescaledb-ha:pg17` (rolling PG17 line, latest push 2026-10-27), `redis:7.4-alpine`, `axllent/mailpit:v1.32.0` (GitHub tags; Docker Hub listing is stale for mailpit).
- Mailpit healthcheck uses `wget` (present in the image); Postgres healthcheck is `pg_isready`; Redis is `PING`.
- Timescale 2.31.0 (rolling pg17 line) ≈ Neon Timescale minors; schema must avoid compression-only features (see ADR-0002).
