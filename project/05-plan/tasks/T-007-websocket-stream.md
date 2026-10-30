# T-007 — WebSocket stream and Redis fan-out on Vercel

- **Milestone:** M1
- **Feature:** FEAT-011
- **Size:** L
- **Risk:** high
- **Depends on:** T-006
- **Status:** todo

## Goal

A browser can mint a short-lived stream token, open `WS /v1/stream` on the Vercel-hosted NestJS API, receive a snapshot of current device state, then receive coalesced deltas with reconnect and resume before the function duration limit.

## Context

- `project/04-adr/0004-websocket-redis-fanout.md` — gateway, Vercel limits, pub/sub
- `project/03-architecture.md` — `POST /v1/stream-token`, `WS /v1/stream`
- `project/05-plan.md` — spike S-003

## Acceptance

- [ ] `POST /v1/stream-token` requires a session or embed token and returns a signed JWT (≤ 5 min) with `workspace_id`, `scope:stream:read`, and an optional device filter.
- [ ] `WS /v1/stream?token=...` rejects missing, expired, or tampered tokens with close code `4401` before any data is sent.
- [ ] The WebSocket endpoint runs on the same NestJS/Fastify app and works on a Vercel preview deployment.
- [ ] On connect the client receives `{type:"snapshot", devices:[...]}` from `device_latest`, limited to the token's filter.
- [ ] The client can send `{type:"subscribe", deviceIds}` and `{type:"unsubscribe", deviceIds}`; unknown IDs are ignored, not fatal.
- [ ] Deltas arrive as `{type:"delta", deviceId, ts, location?, sensors?, status}` at most 4 times per second per device, keeping the latest point.
- [ ] Reconnect with `?since=<eventId>` replays no more than the last 30 s from Redis; older gaps return `{type:"resync"}` and a fresh snapshot.
- [ ] The client reconnects before the Vercel function limit (300 s Hobby / 800 s Pro) with jitter; a close is not shown as an error.
- [ ] Heartbeat ping/pong every 25 s; a dead client is closed within 60 s.
- [ ] A slow consumer drops oldest deltas rather than growing memory; the connection is closed at a documented buffer limit.
- [ ] Browser handshakes validate `Origin` against the allowlist; non-browser clients may omit it.
- [ ] Two API instances share state through Redis: a point ingested on instance A reaches a client on instance B.
- [ ] p95 ingest→client < 1.5 s with 1,000 local clients (spike S-003 result recorded).
- [ ] Integration tests cover auth failure, snapshot, delta, filter, reconnect, fan-out, and forced reconnect at the lifetime limit.

## Out of scope

- Embed token minting and CSP (M4), alert events, history replay beyond 30 s.
- Ably/Centrifugo migration; keep the event contract stable so it stays possible.

## Verification

```bash
pnpm --filter @local-matrix/api test
pnpm typecheck

TOKEN=$(curl -s -X POST localhost:3001/v1/stream-token \
  -H "authorization: Bearer $LM_KEY" -H 'content-type: application/json' \
  -d '{}' | jq -r .token)
websocat "ws://localhost:3001/v1/stream?token=$TOKEN"
```

## Notes

Keep one Redis subscriber per API instance, not per socket. Coalesce in a per-device slot with a 250 ms timer. Do not put the token in a URL that gets logged in production; accept it via `Sec-WebSocket-Protocol` and keep the query fallback for local tools. Vercel connections are pinned to one instance and close at the duration limit; snapshot + `since` is the recovery model.
