# FEAT-001 — HTTP ingest API

> Phase 4+ · Spec is the contract. Target ≤300 lines.

## Summary

A device, gateway, or backend sends GPS and sensor readings to Local Matrix over HTTPS using a workspace API key. The API validates the canonical telemetry envelope, persists the point, updates the device's latest state, and publishes a live event so maps update in near real time. This is the entry point that makes every downstream feature possible.

## Status

- **Catalog:** `FEAT-001`, `FEAT-004`, `FEAT-006`
- **Priority:** Must
- **Status:** specified
- **Owner:** Udith Sandaruwan
- **Tasks:** T-005, T-006

## Non-goals

- Raw TCP/UDP tracker protocols (GT06, Teltonika, JT808) — handled by a future gateway adapter.
- MQTT ingest — FEAT-002, M2.
- Auto-creating unknown devices — explicit registration avoids typo-created fleets and abuse.
- Per-point units, calibration, or sensor metadata — device metadata declares display units in v1.
- Synchronous alert evaluation — alerts run in the worker after persistence.

## User story

As a fleet or IoT developer, I want to POST a telemetry point with an API key and get a fast, deterministic response, so that my devices' positions and sensors appear on the live map without me building ingestion infrastructure.

## Acceptance criteria

- [ ] Given a valid key with `ingest:write` and a registered device, when I POST a valid point, then I receive `202` with an id and the point appears in `device_latest` and the live stream.
- [ ] Given a batch of ≤1,000 points where some are invalid, when I POST the batch, then valid points persist and the response lists per-index errors for the rest.
- [ ] Given the same `Idempotency-Key` within 24 h, when I resend, then no duplicate row is written and the response is `200` with `duplicate:true`.
- [ ] Given a missing or revoked key, when I POST, then I receive `401` and no row is written.
- [ ] Given a key without `ingest:write`, when I POST, then I receive `403 INSUFFICIENT_SCOPE`.
- [ ] Given coordinates outside valid ranges or a sensor map over limits, when I POST, then I receive `422` with field-level errors and no partial write for that point.
- [ ] Given a point for an unregistered `deviceId`, when I POST, then I receive `422 UNKNOWN_DEVICE`.
- [ ] Given a payload over the size limit, when I POST, then I receive `413` before parsing the body.
- [ ] `p95 < 100 ms` for single ingest at 100 req/s; batch of 1,000 completes in < 2 s on the reference environment.
- [ ] No plaintext API key or full telemetry payload appears in logs.

## Behavior

### Happy path

1. Client sends `POST /v1/ingest` with `Authorization: Bearer lm_...`, `Content-Type: application/json`, and a canonical point.
2. The API authenticates the key, resolves `workspace_id`, and opens a transaction with `SET LOCAL app.workspace_id`.
3. The envelope is validated and normalized: ISO timestamp to UTC, numeric coercion rejected, defaults applied.
4. The device is resolved by `(workspace_id, external_id)`; archived devices are rejected.
5. The point is inserted into `telemetry`; `device_latest`, `devices.last_seen_at`, and `devices.status` are updated in the same transaction.
6. The transaction commits; a compact event is published to Redis `ws:workspace:<id>`.
7. The API returns `202` with the point id and accepted count.

### Edge cases

| Case | Expected |
|---|---|
| Missing `timestamp` | Server receive time is used; response echoes the stored `ts`. |
| Future timestamp > 5 min | `422 TIMESTAMP_IN_FUTURE`; clock-skew guidance in the message. |
| Timestamp older than retention | `422 TIMESTAMP_TOO_OLD`; retention window is configurable. |
| Sensor-only point (no `location`) | Accepted; map shows the device as "no location" but sensors update. |
| `lat`/`lng` null or out of range | `422 INVALID_LOCATION` with the offending field. |
| `sensors` > 50 keys or > 2 KB | `422 SENSORS_TOO_LARGE`. |
| Non-scalar sensor value | `422 INVALID_SENSOR_VALUE`. |
| Unknown device | `422 UNKNOWN_DEVICE`; message includes the external id. |
| Archived device | `422 DEVICE_ARCHIVED`. |
| Duplicate idempotency key | `200 {duplicate:true}`; no new row. |
| Same key, different payload | `409 IDEMPOTENCY_CONFLICT`. |
| Batch item invalid | Other items persist; response `202` with `errors:[{index, code, message}]`. |
| Entire batch invalid | `422` with the same per-index error shape; nothing persists. |
| Over rate limit | `429 RATE_LIMITED` with `retry-after`. |
| Redis unavailable | Ingest still succeeds; log a warning; live map recovers on next point or snapshot. |
| Database unavailable | `503 DEPENDENCY_UNAVAILABLE`; no partial write; safe to retry. |

## Data and state

- **Entities:** `telemetry` (append-only), `device_latest` (one row per device), `devices` (`last_seen_at`, `status`).
- **Canonical point fields:**
  - `deviceId: string` — workspace-scoped external id, 1–128 chars.
  - `timestamp?: string` — ISO 8601; defaults to now; max +5 min.
  - `location?: { lat: number, lng: number, altitude?: number, accuracy?: number, speed?: number, heading?: number }`.
  - `sensors?: Record<string, number | boolean | string>` — ≤50 keys, key ≤64 chars, string ≤256 chars.
  - `tags?: Record<string, string>` — ≤20 keys.
  - `source?: string` — defaults to `http`; max 32 chars.
  - `idempotencyKey?: string` — ≤128 chars.
- **State:** a point is immutable after insert. Device status derives from last seen: `moving` / `idle` / `stale` / `offline`; the API stores the raw last point and the read layer derives freshness.
- **Idempotency:** scope `(workspace_id, device_id, idempotency_key)`, TTL 24 h. Header `Idempotency-Key` applies to a single point; per-point `idempotencyKey` applies inside batches. Header wins on conflict.
- **Deletion:** points follow workspace retention; device archival does not delete history in v1.

## Interfaces

### `POST /v1/ingest`

Request:

```http
POST /v1/ingest HTTP/1.1
Authorization: Bearer lm_live_...
Content-Type: application/json
Idempotency-Key: 7f3c2a9e
```

```json
{
  "deviceId": "truck-123",
  "timestamp": "2026-10-30T09:00:00.000Z",
  "location": {
    "lat": 6.9271,
    "lng": 79.8612,
    "altitude": 12.4,
    "accuracy": 5,
    "speed": 42.5,
    "heading": 87
  },
  "sensors": { "temperature": 24.5, "fuel": 68, "door": false },
  "tags": { "driver": "A-12" },
  "source": "http"
}
```

Response `202`:

```json
{
  "accepted": 1,
  "rejected": 0,
  "ids": ["018f4c2a-9f1e-7c3b-8a2d-6b1f0e9d4c21"],
  "duplicate": false
}
```

Duplicate response `200`:

```json
{ "accepted": 0, "rejected": 0, "ids": ["018f4c2a-..."], "duplicate": true }
```

### `POST /v1/ingest/batch`

Request:

```json
{
  "points": [
    { "deviceId": "truck-123", "location": { "lat": 6.9271, "lng": 79.8612 } },
    { "deviceId": "truck-999", "location": { "lat": 6.93, "lng": 79.86 } }
  ]
}
```

Response `202`:

```json
{
  "accepted": 1,
  "rejected": 1,
  "ids": ["018f4c2a-..."],
  "errors": [
    { "index": 1, "code": "UNKNOWN_DEVICE", "message": "Device 'truck-999' is not registered." }
  ]
}
```

### Errors

All errors are `application/problem+json`:

```json
{
  "type": "https://localmatrix.dev/errors/unknown-device",
  "title": "Unknown device",
  "status": 422,
  "detail": "Device 'truck-999' is not registered in this workspace.",
  "code": "UNKNOWN_DEVICE",
  "requestId": "req_01J..."
}
```

| Code | Status | Message |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid API key. |
| `KEY_REVOKED` | 401 | This API key has been revoked. |
| `INSUFFICIENT_SCOPE` | 403 | This key lacks the `ingest:write` scope. |
| `PAYLOAD_TOO_LARGE` | 413 | Payload exceeds the 256 KB / 2 MB limit. |
| `VALIDATION_FAILED` | 422 | One or more fields are invalid. |
| `UNKNOWN_DEVICE` | 422 | Device is not registered in this workspace. |
| `DEVICE_ARCHIVED` | 422 | Device is archived and cannot accept points. |
| `TIMESTAMP_IN_FUTURE` | 422 | Timestamp is more than 5 minutes in the future. |
| `TIMESTAMP_TOO_OLD` | 422 | Timestamp is outside the retention window. |
| `INVALID_LOCATION` | 422 | Coordinates are missing or out of range. |
| `SENSORS_TOO_LARGE` | 422 | Sensor map exceeds 50 keys or 2 KB. |
| `IDEMPOTENCY_CONFLICT` | 409 | This idempotency key was used with a different payload. |
| `RATE_LIMITED` | 429 | Too many points; retry after the indicated delay. |
| `DEPENDENCY_UNAVAILABLE` | 503 | Storage is temporarily unavailable; retry with backoff. |

Auth: API key with `ingest:write`, or a session for manual test sends. CORS is not enabled for ingest; browsers must not hold workspace keys.

### Limits

| Limit | Value |
|---|---|
| Single payload | 256 KB |
| Batch payload | 2 MB |
| Batch points | 1,000 |
| Sensor keys | 50 |
| Sensor map bytes | 2 KB |
| Tags | 20 |
| Default rate | 1,200 points/min per key (burst 300) |
| Idempotency TTL | 24 h |

## Test mapping

| Acceptance | Test | Layer |
|---|---|---|
| Valid point persists and publishes | `ingest.single.persists-and-publishes` | integration |
| Batch partial success | `ingest.batch.partial-success` | integration |
| Idempotent replay | `ingest.idempotency.replay-no-duplicate` | integration |
| Key revoked / wrong scope | `ingest.auth.revoked-and-scope` | integration |
| Envelope validation | `ingest.validation.table` | unit |
| Unknown/archived device | `ingest.device.unknown-archived` | integration |
| Size and rate limits | `ingest.limits.payload-rate` | integration |
| Error shape | `ingest.contract.problem-json` | contract |
| Cross-tenant device id | `ingest.rls.cross-workspace-device` | integration |
| Latency | `ingest.perf.p95` | benchmark |

## Rollout

- Feature flag: none; gated by API key scope and device existence.
- Migration: `telemetry`, `device_latest`, and `api_keys` ship in T-003.
- Rollback: disable ingest at the edge or revoke keys; data remains readable. The endpoint is additive under `/v1`.

## Open questions

| # | Question | Default |
|---|---|---|
| Q1 | Should a first point auto-create a device when the key has `devices:write`? | No in v1; explicit registration. |
| Q2 | Is the 5-minute future window configurable per workspace? | Global env for v1. |
| Q3 | Do we return stored ids for rejected points? | No; only accepted ids. |
| Q4 | Is `source` free text or an enum? | Free text ≤32 chars; UI displays known values. |
