# FEAT-040 — Embeddable live map

> Phase 4+ · Spec is the contract. Target ≤300 lines.

## Summary

A workspace admin configures a read-only map view and hands a partner a snippet. The partner's server mints a short-lived signed token, and the partner's page renders the map in an iframe or a `<local-matrix-map>` web component. The host can react to device clicks and change filters or theme through `postMessage`, but never receives workspace credentials or write access.

## Status

- **Catalog:** `FEAT-040`, `FEAT-041`, `FEAT-042`, `FEAT-043`
- **Priority:** Must
- **Status:** specified
- **Owner:** Udith Sandaruwan
- **Tasks:** T-042, T-043, T-044, T-045, T-046

## Non-goals

- Self-serve embed creation by unauthenticated users.
- Write actions from the embed (device edit, alerts, ingest).
- Native React/Vue SDKs — the web component wraps the iframe.
- Per-view analytics and billing — deferred (FEAT-044).
- Arbitrary custom CSS injection into the embed.

## User story

As a platform partner, I want to embed a live map of my customer's devices in my own product with a server-minted token, so that my users see real-time location without me rebuilding a map or holding long-lived secrets.

## Acceptance criteria

- [ ] Given a workspace admin, when they create an embed, then they can choose name, devices/groups, layers, theme, and an origin allowlist.
- [ ] Given a saved embed, when the builder previews it, then the preview uses the same runtime and reflects saved config.
- [ ] Given a partner server with an `embeds:manage` key, when it calls `POST /v1/embeds/:id/token` with an allowed origin, then it receives a JWT valid for ≤1 h.
- [ ] Given a valid token, when the iframe loads, then it renders the live map with only the configured devices and no console chrome.
- [ ] Given a token minted for `https://a.example`, when it is used from `https://b.example`, then the request is `403` and no data renders.
- [ ] Given an expired token, when the embed loads, then it shows a clear "session expired" state and emits `error`; the host can mint a new token.
- [ ] Given a revoked embed, when any request arrives, then the API returns `410` and the iframe shows "embed unavailable".
- [ ] Given the web component, when the host listens, then `ready`, `device:click`, `viewport:change`, and `error` events fire with documented payloads.
- [ ] Given host commands `focusDevice`, `setFilter`, `setTheme`, when sent, then the map responds and acknowledges.
- [ ] Given a token, when it is used against ingest or query endpoints, then it is rejected: the token only authorizes `embed:read`.
- [ ] The embed never exposes the workspace API key, other workspaces' devices, or device metadata outside the configured scope.
- [ ] CSP `frame-ancestors` contains exactly the saved allowlist for that embed.
- [ ] Embed E2E passes in Chromium, Firefox, and WebKit.

## Behavior

### Happy path

1. Admin opens **Embeds → New**, names it, selects devices/group, theme, and origins, then saves.
2. Builder shows a snippet with a placeholder token and the exact host code.
3. Partner server calls `POST /v1/embeds/:id/token` with `origin`, optional `ttl`, and a key scoped `embeds:manage`.
4. API validates the embed, origin, and key; returns a signed JWT and the iframe URL.
5. Partner page renders `<local-matrix-map token="..." origin="...">` or a plain iframe.
6. The runtime verifies the token, loads config, connects the stream, and emits `ready`.
7. Device clicks emit `device:click` with a safe payload; the host may open its own panel.

### Edge cases

| Case | Expected |
|---|---|
| Origin not in allowlist | `403 ORIGIN_NOT_ALLOWED`; no token minted. |
| Missing `Origin` header on token mint | Rejected unless the embed allows server-side minting with an explicit origin body field. |
| Token TTL > 1 h | Clamped to 1 h; response returns the effective `expiresAt`. |
| Embed has no devices | Valid; runtime shows an empty state, not an error. |
| Device archived after config | Hidden on next token/config fetch; no error. |
| Token in URL leaked via referrer | `Referrer-Policy: no-referrer`; token short-lived; documented as a residual risk. |
| Host CSS | No leakage: iframe is isolated; web component uses Shadow DOM for its wrapper. |
| Multiple embeds on one page | Each has its own token, origin, and stream connection. |
| Origin wildcard subdomain | Not supported in v1; list exact origins. |
| Embed deleted | `410`; host snippet stops working; builder shows revoked state. |
| Stream disconnect | Runtime reconnects with backoff and a fresh token request hook. |

## Data and state

- **`embeds`:** `id`, `workspace_id`, `name`, `config` (devices, groups, layers, theme, showLegend, initialView), `allowed_origins text[]`, `revoked_at`, timestamps.
- **Token claims:** `iss`, `aud: embed`, `sub: embed_id`, `workspace_id`, `scopes: ["embed:read"]`, `allowed_origins`, `device_ids?`, `group?`, `iat`, `exp`, `jti`.
- **State:** `active → revoked`; revoked is terminal. Config edits apply to the next minted token.
- **Deletion:** soft revoke by default; hard delete allowed only when no audit requirement applies. Tokens are not individually revocable in v1; revoking the embed invalidates all.
- **Rate limits:** 60 token mints/min per embed; 20 concurrent WS connections per embed; documented overrides for Enterprise.

## Interfaces

### `POST /v1/embeds`

Request:

```json
{
  "name": "Acme fleet",
  "deviceIds": ["..."],
  "group": null,
  "theme": "dark",
  "allowedOrigins": ["https://app.acme.example"],
  "showLegend": true
}
```

Response `201`:

```json
{ "id": "emb_01J...", "name": "Acme fleet", "allowedOrigins": ["https://app.acme.example"], "createdAt": "2026-10-30T09:00:00.000Z" }
```

Auth: session with `admin`/`owner`, or key with `embeds:manage`.

### `POST /v1/embeds/:id/token`

Request:

```json
{ "origin": "https://app.acme.example", "ttl": 3600 }
```

Response `200`:

```json
{
  "token": "eyJ...",
  "expiresAt": "2026-10-30T10:00:00.000Z",
  "embedUrl": "https://embed.example.com/embed/emb_01J...?token=eyJ..."
}
```

### `GET /embed/:embedId?token=...`

Returns the HTML runtime. Response headers include:

```http
Content-Security-Policy: frame-ancestors https://app.acme.example; default-src 'self'; connect-src 'self' wss://api.example.com
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
```

### Web component

```html
<script src="https://embed.example.com/embed.js" defer></script>
<local-matrix-map
  token="eyJ..."
  origin="https://app.acme.example"
  height="480"
  theme="dark">
</local-matrix-map>
```

Events (`detail`):

| Event | Payload |
|---|---|
| `ready` | `{ embedId, deviceCount }` |
| `device:click` | `{ deviceId, name, status, ts, location? }` |
| `viewport:change` | `{ bounds: [w, s, e, n], zoom }` |
| `error` | `{ code, message, recoverable }` |

Commands (host → embed):

| Command | Payload |
|---|---|
| `focusDevice` | `{ deviceId, zoom? }` |
| `setFilter` | `{ deviceIds?, group?, status? }` |
| `setTheme` | `{ theme: "dark" \| "light" }` |

Every message includes `source: "local-matrix"` and a `version: 1`; the host must validate `event.origin` and the iframe `contentWindow`.

### Errors

| Code | Status | Message |
|---|---|---|
| `ORIGIN_NOT_ALLOWED` | 403 | This origin is not allowed for this embed. |
| `EMBED_NOT_FOUND` | 404 | Embed not found. |
| `EMBED_REVOKED` | 410 | This embed has been revoked. |
| `TOKEN_EXPIRED` | 401 | Embed token expired; mint a new one. |
| `TOKEN_INVALID` | 401 | Embed token is invalid. |
| `RATE_LIMITED` | 429 | Too many token requests; retry later. |

## Security requirements

- Tokens are signed with EdDSA (preferred) or HS256; keys rotate without breaking active embeds (kid header).
- Read-only scope enforced at the route and query layer, not only in the UI.
- Origin allowlist checked on token mint, iframe request, and WS handshake.
- No workspace id, API key, or device outside the configured scope in any response.
- Labels and names rendered as text; no `innerHTML` from device data.
- Token never logged; URLs with tokens are redacted in access logs.
- Frame ancestors generated per embed, never a global wildcard.
- Embed runtime served from a separate origin with a strict CSP.

## Test mapping

| Acceptance | Test | Layer |
|---|---|---|
| Create/update/revoke embed | `embed.crud` | integration |
| Token mint + origin check | `embed.token-origin` | integration |
| Expired/revoked token | `embed.token-expiry-revoke` | integration |
| Token cannot write | `embed.scope-readonly` | integration |
| iframe renders live map | `embed.iframe-live` | e2e |
| Web component events | `embed.component-events` | e2e |
| Host commands | `embed.commands` | e2e |
| CSP frame-ancestors | `embed.csp` | integration |
| Cross-browser | `embed.cross-browser` | e2e |
| Tenant isolation | `embed.rls` | integration |

## Rollout

- Feature flag: `embeds_v1`, off by default until M4.
- Migration: `embeds` table (M4 migration), no change to telemetry.
- Rollback: disable the flag, revoke embeds, and keep minted tokens to expire within 1 h. The runtime route returns `410` when the flag is off.

## Open questions

| # | Question | Default |
|---|---|---|
| Q1 | iframe-first or component-first in docs? | iframe first, component as the nicer option. |
| Q2 | Allow `http://localhost` origins for development? | Yes, only when `NODE_ENV !== production`. |
| Q3 | Token via query or fragment? | Query for iframe compatibility; fragment accepted by the runtime and stripped. |
| Q4 | Per-embed branding (logo, colors)? | Theme + legend only in v1. |
