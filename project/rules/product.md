# Project rules — product and tenant invariants

These apply to every feature. Read this file before touching telemetry, tenancy, or embeds.

- Every tenant-owned table has `workspace_id NOT NULL`; every request-path query runs with `app.workspace_id` set and passes RLS.
- The API never uses a `BYPASSRLS` or superuser connection in a request path. Migrations and maintenance may use a separate role.
- `workspace_id` comes from the authenticated session, key, or signed token — never from a request body, query string, or client header.
- API keys are stored hashed, displayed once, scoped, and revocable. Never log a key, token, or full telemetry payload.
- Telemetry is append-only. Corrections are new points, not updates; `device_latest` is the only mutable projection.
- The canonical envelope is shared from `packages/shared`; the API and worker must not fork validation rules.
- Reject future timestamps > 5 min and points outside the retention window; never silently clamp.
- Unknown devices are rejected in v1. Do not auto-create devices from ingest.
- Sensor maps are flat scalars, ≤50 keys and ≤2 KB; tags are string→string, ≤20 keys.
- A point and its `device_latest` update commit in one transaction; publish to Redis only after commit.
- Live events are coalesced to ≤4 Hz per device; clients keep the newest `ts` and ignore older points.
- Embed tokens are read-only, ≤1 h, origin-bound, and scoped to one embed. They never grant workspace API scopes.
- CSP `frame-ancestors` is generated per embed from its allowlist; never use a global `*`.
- Device names, labels, and sensor strings are rendered as text, never as HTML.
- Destructive actions (workspace delete, key revoke, embed revoke, member removal) are audited once the audit log ships.
- Demo data lives in a workspace flagged `is_demo` and is excluded from exports, metrics, and billing.
- Public API changes ship with an OpenAPI update and a deprecation note; `/v1` changes are additive.
- Retention, export, and deletion must honor the workspace's configured policy; never hard-delete without an audited path.
- When two sources of truth disagree (spec vs code vs this file), stop and ask; do not pick silently.
