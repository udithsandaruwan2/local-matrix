# T-005 — Devices, API keys, and auth guards

- **Milestone:** M1
- **Feature:** FEAT-003, FEAT-005
- **Size:** M
- **Risk:** medium
- **Depends on:** T-003, T-004
- **Status:** todo

## Goal

Workspace members can create, list, update, and archive devices; create and revoke scoped API keys; and every API route resolves a session or API key into a tenant context that runs through `PrismaService.withWorkspace`.

## Context

- `project/03-architecture.md` — data model, auth boundaries
- `project/04-adr/0005-tenant-isolation-rls.md` — RLS and request role
- `project/05-plan/tasks/T-003-schema-rls.md` — tenant tables

## Acceptance

- [ ] `POST /v1/devices` creates a device with a unique `(workspace_id, external_id)`; duplicates return `409 DEVICE_EXISTS`.
- [ ] `GET /v1/devices` supports `search`, `status`, `group`, `limit`, and cursor pagination; results are workspace-scoped.
- [ ] `PATCH /v1/devices/:id` updates `name`, `type`, `group`, and `metadata`; `external_id` is immutable.
- [ ] `DELETE /v1/devices/:id` archives the device (soft delete) and hides it from default lists.
- [ ] `POST /v1/api-keys` returns the plaintext key exactly once with a `lm_` prefix and 8-char display prefix; only a hash is stored.
- [ ] Keys carry explicit scopes (`ingest:write`, `devices:read`, `query:read`, `embeds:manage`, `webhooks:manage`); missing scope returns `403 INSUFFICIENT_SCOPE`.
- [ ] `DELETE /v1/api-keys/:id` revokes immediately; a revoked key returns `401 KEY_REVOKED`.
- [ ] Key verification uses a constant-time hash comparison; plaintext never appears in logs, errors, or the database.
- [ ] A NestJS guard resolves session/API key, attaches `workspaceId` and `scopes`, and rejects missing credentials with `401` before the controller runs.
- [ ] Controllers use `PrismaService.withWorkspace`; no tenant query runs outside it.
- [ ] `last_used_at` is updated at most once per minute per key.
- [ ] Unit tests cover scope checks, duplicate keys, and archived devices; integration tests prove workspace A cannot read workspace B devices or keys.

## Out of scope

- Ingest routes (T-006), session login UI (T-009), audit log (M2), key rotation grace periods.
- Per-device permissions or group-level access control.

## Verification

```bash
pnpm --filter @local-matrix/api test
pnpm typecheck

# with a seeded session or workspace key
curl -s -X POST localhost:3001/v1/devices \
  -H "authorization: Bearer $LM_KEY" -H 'content-type: application/json' \
  -d '{"externalId":"truck-1","name":"Truck 1","type":"vehicle"}' | jq .
curl -s localhost:3001/v1/devices -H "authorization: Bearer $LM_KEY" | jq .
```

## Notes

Hash keys with SHA-256 plus a server-side pepper from env; do not use a slow password hash for high-volume API keys. Store only the prefix for display. Return `401` for missing/invalid credentials and `403` for valid-but-insufficient scope; never blur the two. Keep the guard small and test it independently of Prisma.
