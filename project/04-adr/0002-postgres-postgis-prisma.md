# ADR-0002 — PostgreSQL + PostGIS + TimescaleDB with Prisma 7

- **Status:** accepted (revised 2026-10-30 before G3 approval)
- **Date:** 2026-10-30
- **Deciders:** Udith Sandaruwan
- **Supersedes:** none

## Context

The platform stores relational tenancy data (workspaces, members, devices, keys, embeds), spatial facts (geofences, latest positions, tracks), and high-volume time-series telemetry. V1 targets 100 events/s, 10,000 devices, 90-day raw retention, and sub-500 ms track queries. The owner has fixed PostgreSQL + Prisma 7, with Docker locally and Neon later.

## Decision

Use PostgreSQL 17 with PostGIS and TimescaleDB as the single primary store, accessed through Prisma 7.

- `telemetry` is a Timescale hypertable on `ts` (7-day chunks) with `workspace_id`, `device_id`, `geom geography(Point,4326)`, and `sensors jsonb`.
- `device_latest` is a normal table with one row per device, upserted in the same transaction as the telemetry insert.
- Geofences use `geography(Polygon,4326)` with GiST indexes.
- Continuous aggregates `telemetry_1m` and `telemetry_1h` power charts and reports.
- Compression after 7 days where the extension supports it; retention per plan.
- Prisma 7 is the only ORM: `prisma-client` generator (Rust-free), `@prisma/adapter-pg`, `prisma.config.ts`.
- `DATABASE_URL` is the pooled runtime connection; `DIRECT_URL` is used only for migrations.
- Extensions, hypertables, partitions, indexes, RLS policies, and grants are hand-written SQL migrations. Prisma owns the typed schema for ordinary tables and raw SQL covers spatial/time-series specifics.
- IDs are UUIDv7, generated in the application.

**Neon note:** Neon supports PostGIS and TimescaleDB, but only Apache-2 Timescale features; compression is not available. Local Docker may use compression, Neon may not. If storage cost exceeds the budget at 90-day retention, the exit path is Timescale Cloud, a self-hosted primary, or native monthly partitions with colder retention.

## Alternatives

| Option | Why not chosen |
|---|---|
| Postgres + ClickHouse | Better billion-row OLAP, but a second store, weaker joins/transactions, and more ops than v1 needs |
| QuestDB + PostGIS | Excellent ingest throughput, but thinner relational/spatial ecosystem and another operational surface |
| Vanilla Postgres with native partitioning | Viable and Neon-portable, but loses compression and continuous aggregates; kept as a fallback |
| MongoDB / DynamoDB | Weak spatial joins and time-window aggregation for this workload |
| Drizzle ORM | Owner constraint; Prisma 7 is the chosen ORM |

## Consequences

**Positive**
- One engine for tenancy, spatial queries, time series, and transactions.
- PostGIS is the strongest open spatial toolkit; Timescale is mature and Postgres-native.
- Prisma gives typed queries and migrations for the relational core; SQL stays available where it matters.
- Local Docker and Neon use the same PostgreSQL dialect, so the app does not fork by environment.

**Negative**
- Prisma does not model hypertables, partitions, or RLS policies; those migrations are hand-written and need review.
- Neon cannot use Timescale compression, so 90-day raw retention is more expensive there.
- Timescale extension versions differ between local Docker and Neon; CI must test both.
- Prisma interactive transactions are required for `SET LOCAL app.workspace_id`; every tenant query must go through the helper.

**Neutral**
- Redis holds the hot latest state, so the map does not query Postgres for every marker.

## Revisit if

- Raw telemetry exceeds 10B rows or analytics queries exceed 2 s at p95.
- Neon storage cost for 90-day retention exceeds the budget.
- Prisma cannot express a required query without unsafe raw SQL.
- Ingest sustained exceeds 5,000 events/s on one primary.

## References

- `project/03-architecture.md` data model
- `project/04-adr/0005-tenant-isolation-rls.md`
- `project/06-specs/FEAT-001-ingest-api.md`
