# FEAT-010 — Live map and realtime stream

> Phase 4+ · Spec is the contract. Target ≤300 lines.

## Summary

A signed-in operator opens a map and sees the current position and state of every device in the workspace. Positions update over a WebSocket stream on the Vercel-hosted NestJS API with a snapshot-then-deltas model, a clear connection state, and a device drawer that updates live. Connections are bounded by the Vercel function duration, so the client reconnects and resyncs transparently. The same map core is reused by the public demo and by embeds.

## Status

- **Catalog:** `FEAT-010`, `FEAT-011`, `FEAT-012`, `FEAT-013`
- **Priority:** Must
- **Status:** specified
- **Owner:** Udith Sandaruwan
- **Tasks:** T-007, T-008

## Non-goals

- Historical track playback and scrubbing — FEAT-020, M2.
- Geofence drawing and alert overlays — FEAT-014/015, M3.
- Turn-by-turn routing, 3D, or street-level imagery.
- Editing device positions from the map.

## User story

As a fleet operator, I want to watch all my devices move on one map and inspect any device's latest readings, so that I can spot problems and answer "where is it now?" without refreshing or querying the database.

## Acceptance criteria

- [ ] Given a workspace with devices, when I open `/map`, then I see a dark map fitted to the fleet and one marker per device.
- [ ] Given a new ingest point, when the stream is connected, then the marker moves within 1.5 s p95 without a page refresh.
- [ ] Given a selected device, when new points arrive, then the drawer's speed, heading, last-seen, and sensor values update in place.
- [ ] Given a lost connection, when the socket closes, then the UI shows `reconnecting` and retries with backoff; on success it shows `live` and resyncs.
- [ ] Given the Vercel function duration limit (300 s Hobby / 800 s Pro), when the socket closes, then the client reconnects with `since` and the user sees at most a brief stale badge, not an error.
- [ ] Given a device with no point for > 2 min, when I view it, then it is marked `stale`; after 10 min it is `offline`.
- [ ] Given 5,000 devices, when updates stream at 4 Hz per device, then the map stays ≥30 fps on the reference laptop.
- [ ] Given a filter (search, status, group), when applied, then both the map and the list reflect it and the URL is shareable.
- [ ] Given a keyboard-only user, when navigating the device list, then they can select a device, open the drawer, and close it with `Esc`.
- [ ] Given a device without location (sensor-only), when I view the list, then it appears without a marker and is labeled "no location".
- [ ] Given a stream token older than its TTL, when connecting, then the socket closes with `4401` and the client requests a fresh token.

## Behavior

### Happy path

1. The console requests `POST /v1/stream-token` with the session; the API returns a signed token (≤5 min) scoped to the workspace.
2. The client opens `WS /v1/stream` and sends `{type:"subscribe", filter}`.
3. The server sends `{type:"snapshot", devices:[...]}` from `device_latest`.
4. The client renders markers, fits bounds once, and stores the viewport per user.
5. New points arrive as coalesced `delta` events; markers interpolate and the drawer updates.
6. A heartbeat keeps the connection alive; the badge reflects state.

### Edge cases

| Case | Expected |
|---|---|
| Empty workspace | Map shows the fleet area default and a "create your first device" call to action. |
| No devices match filter | Empty state over the map; filters remain editable; "clear filters". |
| Device has no location | Listed with a "no location" badge; no marker. |
| Device archived while selected | Drawer closes; marker disappears; a toast explains. |
| Duplicate/out-of-order point | Keep the newest `ts` per device; ignore older. |
| Burst of points | Coalesce to ≤4 Hz per device; keep the latest. |
| Socket closes | Badge `reconnecting`; exponential backoff 1→30 s with jitter; manual retry. |
| Vercel function limit reached | Treat as a planned close: reconnect with `since`; no error toast. |
| Token expired | Fetch a new token, reconnect once, then show an error with retry. |
| Redis/stream outage | Badge `offline`; map keeps last known state and offers refresh; polling fallback after 30 s. |
| Very large fleet | Cluster at low zoom; viewport-based subscription when the filter supports it. |
| Reduced motion | No marker animation; positions snap. |

## Data and state

- **Snapshot item:** `deviceId`, `name`, `status`, `ts`, `location?`, `sensors?`, `group`.
- **Delta:** `deviceId`, `ts`, `location?`, `sensors?`, `status`.
- **Derived status:** `moving` if speed > 1 and last seen < 2 min; `idle` if last seen < 2 min; `stale` if < 10 min; `offline` otherwise.
- **Viewport:** persisted per user and workspace; "fit fleet" is always available.
- **Filters:** `q`, `status`, `group`, `deviceIds`; reflected in the URL.
- **Client state machine:** `connecting → live → reconnecting → offline`; `live` requires an open socket and a snapshot.
- **Connection lifetime:** Vercel closes at 300 s (Hobby) or 800 s (Pro). The client reconnects at ~80% of the known limit with jitter and sends `since`.

### Stream contract

```json
{ "type": "snapshot", "devices": [ { "deviceId": "truck-1", "ts": "...", "location": { "lat": 6.92, "lng": 79.86 }, "status": "moving" } ] }
{ "type": "delta", "deviceId": "truck-1", "ts": "...", "location": { "lat": 6.93, "lng": 79.87 }, "sensors": { "fuel": 67 } }
{ "type": "resync", "reason": "gap" }
{ "type": "error", "code": "RATE_LIMITED", "message": "..." }
```

Client commands: `subscribe`, `unsubscribe`, `ping`. Server closes with `4401` (auth), `4408` (timeout), `4429` (too many connections).

## Interfaces

### `POST /v1/stream-token`

Request:

```json
{ "deviceIds": ["..."], "group": "north", "ttl": 300 }
```

Response `200`:

```json
{ "token": "eyJ...", "expiresAt": "2026-10-30T09:05:00.000Z", "wsUrl": "wss://api.example.com/v1/stream" }
```

Auth: session cookie or embed token. A workspace API key may mint a token only with `query:read`.

### `WS /v1/stream`

- Token via `Sec-WebSocket-Protocol: lm.token.<jwt>` (preferred) or `?token=` for local tools.
- Origin checked against the allowlist for browser handshakes.
- Max 10 subscriptions per connection; max 1,000 device ids per filter.

### UI routes

| Route | Purpose |
|---|---|
| `/map` | Full live map with list, filters, drawer. |
| `/map?device=<id>` | Deep link that selects a device. |

## Test mapping

| Acceptance | Test | Layer |
|---|---|---|
| Snapshot then delta | `stream.snapshot-delta` | integration |
| Token expiry and origin | `stream.auth-expiry-origin` | integration |
| Reconnect and resync | `stream.reconnect-resync` | integration |
| Forced reconnect at limit | `stream.lifetime-reconnect` | integration + e2e |
| Multi-instance fan-out | `stream.redis-fanout` | integration |
| Marker updates | `map.marker-live-update` | e2e |
| Filters and URL | `map.filters-url` | e2e |
| Drawer live values | `map.drawer-live` | e2e |
| Stale/offline states | `map.status-thresholds` | unit + e2e |
| 5k marker performance | `map.perf-5k` | benchmark |
| Keyboard access | `map.keyboard` | e2e + axe |

## Rollout

- Feature flag: `live_map_v1` for the console route; demo and embed use the same core later.
- Migration: none beyond T-003.
- Rollback: hide the route; the stream endpoint is additive and can be disabled without affecting ingest.

## Open questions

| # | Question | Default |
|---|---|---|
| Q1 | Cluster below zoom 10 or 8? | 10; revisit after S-001. |
| Q2 | Interpolate movement or snap? | Interpolate 1 s, snap under reduced motion. |
| Q3 | Subscribe by viewport for >5k devices? | Yes in M2 if needed; filter first. |
| Q4 | Should the drawer show raw JSON? | No; a "copy JSON" action instead. |
