# T-006 — Ingest API: single, batch, and idempotency

- **Milestone:** M1
- **Feature:** FEAT-001, FEAT-004, FEAT-006
- **Size:** L
- **Risk:** high
- **Depends on:** T-003, T-005
- **Status:** todo

## Goal

`POST /v1/ingest` and `POST /v1/ingest/batch` accept canonical telemetry points, validate and normalize them, persist to the hypertable, upsert `device_latest`, and publish a live event after commit.

## Context

- `project/06-specs/FEAT-001-ingest-api.md` — contract
- `project/04-adr/0009-canonical-telemetry-schema.md` — envelope and limits
- `project/03-architecture.md` — durable vs live path

## Acceptance

- [ ] Single ingest returns `202 {accepted:1, rejected:0, ids:[...]}` and persists exactly one row.
- [ ] Batch accepts up to 1,000 points, validates each independently, and returns per-point errors without failing the whole batch.
- [ ] Validation rejects: unknown device, missing/invalid `timestamp`, future timestamp > 5 min, out-of-range `lat`/`lng`, `sensors` > 50 keys or > 2 KB, `tags` > 20 keys, and non-scalar sensor values.
- [ ] Missing `timestamp` defaults to server receive time; `source` defaults to `http`.
- [ ] `Idempotency-Key` (or `point.idempotencyKey`) deduplicates per `(workspace_id, device_id, key)`; a repeat returns `200` with `duplicate:true` and writes no row.
- [ ] Telemetry insert and `device_latest` upsert happen in one Prisma interactive transaction with `app.workspace_id` set; `devices.last_seen_at` and `status` update in the same transaction.
- [ ] Redis publish happens only after a successful commit, on channel `ws:workspace:<workspace_id>`.
- [ ] Payload limit is 256 KB single / 2 MB batch; oversized returns `413 PAYLOAD_TOO_LARGE`.
- [ ] Rate limit is per API key; over-limit returns `429` with `retry-after`.
- [ ] p95 single-point latency < 100 ms at 100 req/s locally; batch of 1,000 < 2 s.
- [ ] Contract tests cover every documented error code and status.
- [ ] A Vercel preview can ingest a point against a Neon branch.

## Out of scope

- MQTT bridge (T-025), WebSocket fan-out (T-007), query/track endpoints (M2), alert evaluation.
- Auto-provisioning unknown devices; unknown `deviceId` is a validation error in v1.

## Verification

```bash
pnpm --filter @local-matrix/api test
pnpm typecheck

curl -s -X POST localhost:3001/v1/ingest \
  -H "authorization: Bearer $LM_KEY" -H 'content-type: application/json' \
  -H 'idempotency-key: demo-1' \
  -d '{"deviceId":"truck-1","timestamp":"2026-10-30T09:00:00Z","location":{"lat":6.9271,"lng":79.8612,"speed":42.5}}' | jq .

psql "$DIRECT_URL" -c "SELECT count(*), max(ts) FROM telemetry;"
redis-cli subscribe 'ws:workspace:*'
```

## Notes

Validate with one Zod schema shared from `packages/shared`; do not duplicate the envelope in the API and the worker. Cap the batch at 1,000 and use a single multi-row `INSERT ... SELECT * FROM unnest(...)` via `$executeRaw` for throughput; Prisma `createMany` cannot return generated IDs. Publish a compact event, not the full row, and include `workspace_id` for channel routing.
