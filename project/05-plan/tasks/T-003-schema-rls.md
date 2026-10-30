# T-003 — Prisma schema, hypertable, indexes, and RLS

- **Milestone:** M1
- **Feature:** FEAT-003, FEAT-004, FEAT-051
- **Size:** L
- **Risk:** high
- **Depends on:** T-002
- **Status:** todo

## Goal

Prisma 7 plus hand-written SQL migrations create the M1 core schema — workspaces, members, devices, API keys, telemetry hypertable, and device_latest — with indexes, tenant columns, and forced row-level security.

## Context

- `project/03-architecture.md` — data model and invariants
- `project/04-adr/0002-postgres-postgis-prisma.md` — Prisma, hypertable, Neon caveats
- `project/04-adr/0005-tenant-isolation-rls.md` — RLS and `withWorkspace`
- `project/04-adr/0009-canonical-telemetry-schema.md` — telemetry fields

## Acceptance

- [ ] Prisma 7 schema defines `Workspace`, `Member`, `Device`, `ApiKey`, `Telemetry`, and `DeviceLatest` models; `prisma validate` passes.
- [ ] Hand-written SQL migrations create `telemetry` as a Timescale hypertable on `ts` with 7-day chunks, and `device_latest` as a normal table.
- [ ] Indexes exist on `(workspace_id, device_id, ts DESC)`, `device_latest(workspace_id)`, and a GiST index on `telemetry.geom`.
- [ ] Every tenant table has `workspace_id NOT NULL` and a foreign key to `workspaces(id)`.
- [ ] RLS is enabled and forced on every tenant table; policies use `current_setting('app.workspace_id', true)` for `USING` and `WITH CHECK`.
- [ ] The request-path role `app_user` has `NOBYPASSRLS` and only the needed grants; migrations use a separate role.
- [ ] `PrismaService.withWorkspace(workspaceId, fn)` opens an interactive transaction, runs `set_config('app.workspace_id', $1, true)`, and fails closed outside it.
- [ ] A test inserts two workspaces and proves workspace A cannot select/update/delete workspace B rows, including via raw SQL.
- [ ] `pnpm db:migrate` is idempotent on a fresh database; `prisma migrate deploy` works against a Neon branch.
- [ ] UUIDv7 IDs are generated in the application; no serial IDs leak.

## Out of scope

- Auth provider tables (T-009), geofences, alerts, webhooks, embeds (later milestones).
- Compression/retention policies beyond the hypertable baseline.

## Verification

```bash
pnpm db:reset
pnpm db:migrate
pnpm db:generate
psql "$DIRECT_URL" -c "\d+ telemetry"
psql "$DIRECT_URL" -c "SELECT * FROM timescaledb_information.hypertables;"
psql "$DIRECT_URL" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';"
pnpm test --filter @local-matrix/db
```

## Notes

Write the RLS isolation test before the policies. Keep `telemetry` and RLS in hand-written SQL because Prisma does not model hypertables or policies. Use `Unsupported("geography(Point,4326)")` only where Prisma must see the column; prefer raw SQL for spatial writes. Never use a superuser for application connections.
