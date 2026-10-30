# ADR-0006 — Signed short-lived embed tokens + iframe/web component

- **Status:** accepted (revised 2026-10-30 before G3 approval)
- **Date:** 2026-10-30
- **Deciders:** Udith Sandaruwan
- **Supersedes:** none

## Context

Partners want to embed a live map in their own product without exposing workspace API keys or allowing writes. The embed must work in any host stack (React, Vue, plain HTML, server-rendered), be themeable, and enforce origin and tenant boundaries. It must also support host interaction (device click, viewport change) without giving the host direct API access.

The web app and embed runtime are static Vite apps on Netlify; the API is on Vercel. CSP `frame-ancestors` must vary per embed, which static hosting cannot do by itself.

## Decision

Use a two-part embed model:

1. **Server-side token minting.** The partner’s server calls `POST /v1/embeds/:id/token` with a workspace API key scoped to `embeds:manage`. The response is a signed JWT (EdDSA preferred, HS256 fallback) with `embed_id`, `workspace_id`, `scopes: ["embed:read"]`, `allowed_origins`, optional `device_ids`/`group`, and `exp` ≤ 1 hour.
2. **Client runtime.** The embed runtime is a static Vite app on Netlify at `embed.localmatrix.dev`. The iframe HTML shell is served by the API at `GET /embed/:embedId?token=...` so it can generate `Content-Security-Policy: frame-ancestors` from the saved allowlist. The shell loads the hashed Netlify assets. A tiny `embed.js` web component on Netlify wraps the iframe, forwards the token, validates `event.origin`, and exposes a `postMessage` API.

Security controls:

- Read-only scope; the token cannot call ingest/query/write endpoints.
- Origin allowlist checked on token mint, iframe request, and WebSocket handshake.
- CSP `frame-ancestors` generated per embed request from the allowlist.
- Token TTL ≤ 1 hour; the host mints a fresh token per page load.
- Embed revocation returns `410` immediately.
- Per-embed rate limit and connection cap.
- postMessage events: `ready`, `device:click`, `viewport:change`, `error`; host commands: `focusDevice`, `setFilter`, `setTheme`.
- No raw HTML in popups; labels render as text.
- `Referrer-Policy: no-referrer` and token redaction in access logs.

## Alternatives

| Option | Why not chosen |
|---|---|
| iframe only | Simple, but weak host interaction and no typed events |
| JS SDK only (no iframe) | Full control, but forces a build step and leaks map code into the host bundle |
| Public embed key in URL | Long-lived secrets leak through referrers, screenshots, and logs |
| Workspace API key in the browser | Grants write access and full workspace scope; unacceptable |
| Signed URL with no token | Hard to scope devices, origins, and expiry per view |
| Netlify Edge Function for CSP | Adds a second config lookup path; the API already owns embed config and tokens |

## Consequences

**Positive**
- Works in any host, including server-rendered pages and no-code sites.
- Read-only, origin-bound, short-lived credentials.
- The same MapLibre map code powers console, demo, and embed.
- Host can build its own detail panel from `device:click`.
- Static assets are CDN-cached on Netlify; only the tiny HTML shell hits Vercel.

**Negative**
- Two artifacts to maintain (`embed.js` + iframe app) across two providers.
- Token refresh is the host’s responsibility; expired-token UX must be clear.
- CSP `frame-ancestors` must be generated carefully per request.
- The embed HTML shell depends on the API being available; static assets alone cannot render.

**Neutral**
- A future React SDK can wrap the same web component.

## Revisit if

- Partners require a native React component with direct map control.
- Token refresh becomes a support burden; add a scoped refresh token or session endpoint.
- CSP/frame-ancestors cannot express a partner’s wildcard-subdomain need.
- Netlify Edge Functions make per-embed headers simpler than the API shell.

## References

- `project/06-specs/FEAT-040-embeddable-map.md`
- `project/03-architecture.md` threat model
