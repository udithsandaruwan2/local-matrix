# ADR-0004 — WebSocket gateway on Vercel Functions + Redis pub/sub

- **Status:** accepted (revised 2026-10-30 before G3 approval)
- **Date:** 2026-10-30
- **Deciders:** Udith Sandaruwan
- **Supersedes:** none

## Context

The console and embeds need live position, sensor, status, and alert updates. The API already owns ingest, auth, tenant context, and Redis. Adding a dedicated realtime service would introduce a second auth model and another stateful component before demand is proven. V1 targets 1,000 concurrent viewers and 100 events/s.

Vercel Functions added native WebSocket support (public beta June 2026, GA October 2026). Connections are pinned to one function instance and close at the function duration limit: 300 s on Hobby, 800 s configurable on Pro, 1,800 s in beta. Redis remains the shared state and fan-out layer.

## Decision

Run the WebSocket gateway inside `apps/api` on Vercel Functions, using the NestJS Fastify server and `@fastify/websocket` (or a `ws` server attached to the Fastify HTTP server).

- Client requests a short-lived stream token via `POST /v1/stream-token`.
- On connect, the server sends `snapshot` of subscribed devices from `device_latest`.
- Ingest publishes normalized events to Redis channel `ws:workspace:<id>` after commit.
- Each API instance subscribes once, filters per connection, coalesces updates per device (latest wins), and sends at most 4 Hz per device.
- Heartbeat every 25 s. The client reconnects with exponential backoff before the 300 s limit and sends `since=<eventId>`; the server replays at most 30 s or returns `resync` with a fresh snapshot.
- On Redis outage, the UI falls back to 5 s snapshot polling.
- The event contract is transport-agnostic so Ably/Centrifugo can replace the gateway later.

## Alternatives

| Option | Why not chosen |
|---|---|
| Ably / Pusher | Fastest to integrate, but per-message cost and data-residency questions for location data |
| Centrifugo | Excellent scale and multi-transport support, but a second service, second auth model, and more ops for v1 |
| Cloudflare Durable Objects | Strong WebSocket model, but would move the API/runtime and complicate Postgres access |
| Socket.IO | Familiar, but heavier protocol and fallbacks than needed; raw WS is enough |
| Vercel Daemon for WS | Daemons have no inbound HTTP/TCP traffic; they cannot accept WebSocket connections |

## Consequences

**Positive**
- One deployable owns auth, tenant context, and fan-out.
- No extra realtime vendor at v1.
- Redis pub/sub lets any instance serve any connection; no sticky sessions.
- The client already needs reconnect logic, so the 300 s limit is a bounded, testable behavior.

**Negative**
- Connections are short-lived by platform design; the client must reconnect and resync every few minutes.
- Every reconnect costs a function invocation and a snapshot query.
- Backpressure and coalescing must be implemented carefully.
- Vercel WebSocket support is new; pin CLI/runtime versions and test upgrade behavior.

**Neutral**
- At 5k+ connections or sustained fan-out above 500 events/s, move the gateway to Ably/Centrifugo without changing the client protocol.

## Revisit if

- Concurrent connections exceed 5,000 or fan-out exceeds 500 events/s.
- Reconnect churn hurts p95 latency or cost.
- Replay/guaranteed delivery becomes a product requirement.
- Vercel changes WebSocket limits or pricing.

## References

- `project/06-specs/FEAT-010-live-map.md`
- `project/05-plan.md` spike S-003
