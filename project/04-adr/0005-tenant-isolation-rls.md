# ADR-0005 — Tenant isolation with workspace_id + Postgres RLS

- **Status:** accepted (revised 2026-10-30 before G3 approval)
- **Date:** 2026-10-30
- **Deciders:** Udith Sandaruwan
- **Supersedes:** none

## Context

Location traces are sensitive. A single missing `WHERE workspace_id = ...` would leak one customer's fleet to another. The product is multi-tenant from day one, and the team is small enough that “remember to filter” is not an acceptable control. The API uses Prisma 7 on Vercel and Neon's pooled connections, so tenant context must be transaction-scoped and pool-safe.

## Decision

Use a shared schema with `workspace_id` on every tenant-owned table, plus PostgreSQL row-level security.

- A NestJS guard resolves the session, API key, or signed embed token to a workspace.
- Every tenant request runs through `PrismaService.withWorkspace(workspaceId, fn)`, which opens an interactive transaction and runs `SELECT set_config('app.workspace_id', $1, true)` before any query.
- RLS policies use `current_setting('app.workspace_id', true)::uuid` for `USING` and `WITH CHECK`.
- The request-path database role is `app_user` with `NOBYPASSRLS`; migrations and workers use a separate role.
- Every tenant table gets `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`.
- A dedicated isolation test suite attempts cross-workspace reads/writes for every table.
- Raw SQL and `$queryRaw` are allowed only inside the same helper; a lint rule bans direct tenant-model access outside it.
- IDs are UUIDv7 to avoid enumeration and improve index locality.

## Alternatives

| Option | Why not chosen |
|---|---|
| Application-only filtering | One forgotten clause is a breach; review cannot guarantee coverage |
| Prisma client extension that injects `where` clauses | Useful defense in depth, but it does not protect raw SQL and is not a database boundary |
| Schema-per-tenant | Strong isolation, but migrations and connection pooling become painful at scale |
| Database-per-tenant | Strongest isolation, but operationally heavy and expensive for self-serve |
| Separate service per tenant | Overkill for v1 |

## Consequences

**Positive**
- Defense in depth: the database enforces the tenant boundary even if application code is wrong.
- One schema keeps migrations and analytics simple.
- The isolation suite becomes a repeatable security gate.
- `set_config(..., true)` is transaction-local, so it is safe with Neon/PgBouncer transaction pooling.

**Negative**
- RLS policies add query complexity and a small performance cost.
- Every tenant query must be inside the helper; Prisma calls outside a transaction will fail closed.
- Superuser/service-role queries can bypass RLS; they are banned from request paths.
- Prisma migrations cannot express policies, so hand-written SQL needs review.

**Neutral**
- Enterprise customers may later require schema- or database-per-tenant; the `workspace_id` model still maps cleanly.

## Revisit if

- A customer contract requires physical isolation or a dedicated database.
- RLS policy overhead materially affects p95 at 10× scale.
- The app needs cross-workspace analytics; use a separate read model, not a policy bypass.

## References

- `project/03-architecture.md` data model
- `project/rules/product.md`
- `project/05-plan.md` T-003, T-011
