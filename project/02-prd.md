# Product requirements document (PRD)

> Phase 2 · Gate G2 · Draft for human review. Decision document, not a novel.

## Summary

Local Matrix is a multi-tenant platform for real-time location and sensor telemetry. It gives teams one place to ingest GPS and sensor data, watch it on a live map, explore history, set geofences and alerts, and distribute the same data through APIs, webhooks, and embeddable maps.

The product has three surfaces:

1. **A public home page and demo** that explain the product and let a visitor see a live map without signing up.
2. **An authenticated console** for operations, devices, dashboards, geofences, alerts, API keys, webhooks, embeds, and workspace settings.
3. **A developer platform** — ingest API, query API, WebSocket stream, webhooks, OpenAPI docs, and a signed embed runtime.

The v1 goal is to prove one complete loop: **connect → normalize → visualize → distribute**.

## Problem and evidence

See `project/01-discovery.md`. The short version: every team building live location features rebuilds ingestion, storage, realtime fan-out, map rendering, tenancy, and embed security. Existing products are either protocol-heavy fleet apps, generic IoT platforms, or map-only tools.

## Users and jobs

| Segment | Job to be done | Today | Why switch |
|---|---|---|---|
| Operations manager | See every asset and exception in real time | Vendor portals, spreadsheets, Traccar | One live map with sensors, alerts, and history; no protocol work |
| IoT / platform developer | Add live location to an app | Custom MQTT + Timescale + WebSocket + Mapbox | One API, one schema, one realtime channel |
| SaaS product team | Embed a branded live map | Mapbox/Felt + separate backend | Signed embed, tenant-safe, no GIS hire |
| Integrator / reseller | Offer a white-label tracking product | Fork Traccar, rebuild UI | API-first, embed-first, multi-tenant |

## Outcomes and metrics

- **Primary:** time-to-first-live-position (TTFLP) < 5 minutes for 80% of new workspaces.
- **Activation:** 60% of signups ingest a point within 24 hours.
- **Live quality:** ingest success > 99.5%; live latency p95 < 1.5 s.
- **Embed:** embed render success > 99.9%; median embed creation-to-first-render < 1 day.
- **Guardrails:** API error rate < 1%; query p95 < 500 ms; zero cross-tenant leaks; LCP < 2.5 s on the home page.
- **Measurement:** product analytics events (`signup_completed`, `device_created`, `first_point_ingested`, `first_map_view`, `embed_created`, `embed_rendered`), API metrics, and synthetic checks.

## Scope

**In scope**

- Workspaces, members, roles, audit log.
- Device registry, API keys, HTTP ingest (single + batch), MQTT ingest (Should).
- Canonical telemetry: position + arbitrary numeric/boolean/string sensors.
- Live map, device detail, track playback, sensor charts, device table.
- Geofences, alert rules, alert inbox, email and webhook notifications.
- Query API, OpenAPI docs, API playground, outbound webhooks with HMAC.
- Embed builder, signed tokens, iframe runtime, `embed.js` web component, postMessage.
- Public home page, pricing/legal, docs, login/signup, onboarding, demo mode.
- Dashboard widget grid with persisted layouts.

**Out of scope**

- Native mobile apps — v1 proves the platform.
- Hardware/firmware and raw TCP protocol decoders — use HTTP/MQTT or a gateway.
- Route optimization, predictive maintenance, AI dispatch — separate products.
- Self-serve billing — plans assigned manually in v1.
- SAML SSO, SCIM, on-prem, Kubernetes, multi-region — enterprise work later.

**Deferred**

- MQTT ingest if the first demo only needs HTTP — revisit at M2.
- Traccar/gateway adapter — revisit when a partner has raw-TCP hardware.
- Embed analytics (views, referrers) — revisit after 10 embeds are live.
- SMS/push notifications — email + webhook first.
- Trip segmentation and driver scoring — track playback first.

## User journeys

### J1 — First live point

1. Visitor opens the home page, clicks **Start free**.
2. Signs up with email or Google; a workspace is created with the owner role.
3. Onboarding asks for a device name and external ID; a device is created.
4. Console shows a one-time API key and a copyable `curl` snippet.
5. User sends a point; the map marker appears within 1.5 s; the onboarding checklist completes.

Failure: invalid key → 401 with a link to keys; invalid coordinates → 422 with the field and expected range; no map → a clear empty state with the curl snippet.

### J2 — Live operations

1. Operator opens **Overview** or **Map**.
2. Map loads a snapshot, then streams deltas; devices are clustered at low zoom.
3. Operator filters by group/status, clicks a device, and sees speed, heading, last seen, and sensor values.
4. An alert fires; the alert inbox and map badge update without a refresh.

Failure: stream drops → the UI shows “reconnecting” and falls back to a 5 s snapshot poll; stale devices are dimmed with “last seen” age.

### J3 — Investigate history

1. Operator opens a device and chooses a time range.
2. The track is drawn on the map; a playhead animates the route.
3. Sensor charts stay in sync with the playhead.
4. Operator exports the range as CSV.

Failure: no data → empty state with the selected range; large range → server downsamples and warns.

### J4 — Sensor alert

1. Operator creates a rule: `temperature > 8 °C for 5 minutes`.
2. A device reports a reading that crosses the threshold.
3. The worker creates an alert, sends email, and calls the webhook.
4. The alert appears in the inbox with the device, value, and timestamp.

Failure: notification channel down → alert is still stored; delivery retries; the inbox shows delivery status.

### J5 — Embed a live map

1. Developer creates an embed in the console, selects devices/layers/theme, and adds allowed origins.
2. Developer’s server calls the token endpoint and receives a 15-minute JWT.
3. Developer renders `<iframe>` or `<local-matrix-map token="...">` in their product.
4. The embed shows the live map, read-only, with the host’s theme.
5. Host listens for `device:click` via postMessage and opens its own detail panel.

Failure: expired token → embed shows a friendly refresh state; wrong origin → 403 and a console warning; revoked embed → 410.

### J6 — Middleware forwarding

1. Developer registers a webhook endpoint and selects event types.
2. Local Matrix signs each delivery with HMAC-SHA256 and retries with backoff.
3. Developer’s system verifies the signature and ingests normalized events.
4. Delivery logs show status, attempts, and response codes.

Failure: endpoint returns 500 → retries up to 8 times over 24 h, then dead-letter; the console shows the failure.

### J7 — Share a live view

1. Operator creates a read-only share link for a device or map view with an expiry.
2. Recipient opens the link without an account.
3. Recipient sees a branded, read-only map with live updates.
4. Operator revokes the link; access stops immediately.

## Functional requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-01 | Sign up, sign in, sign out, verify email, reset password; Google/GitHub OAuth. | Must | Session persists; invalid credentials show a safe error; OAuth returns to the intended page. |
| FR-02 | Create a workspace on first signup; invite members; roles owner/admin/operator/viewer. | Must | Owner can invite; viewer cannot mutate; role change takes effect on next request. |
| FR-03 | Enforce workspace isolation on every tenant-owned read/write. | Must | A user in workspace A receives 404/empty for workspace B resources; automated RLS test passes. |
| FR-04 | Create, list, update, archive devices with external ID, name, type, group, metadata. | Must | Duplicate external ID in a workspace returns 409; archived device disappears from live map. |
| FR-05 | Create, list, rotate, revoke API keys with scopes and last-used time. | Must | Secret shown once; revoked key returns 401; scope mismatch returns 403. |
| FR-06 | Ingest a single telemetry point over HTTP. | Must | Valid point returns 202 and appears in latest/history; invalid returns 422 with field errors. |
| FR-07 | Ingest a batch of up to 1,000 points. | Must | Partial success returns 202 with accepted/rejected counts and per-item errors. |
| FR-08 | Idempotent ingest via `Idempotency-Key` or per-point key. | Must | Repeating the same key within 24 h does not create a duplicate; response is stable. |
| FR-09 | Canonical telemetry supports position, speed, heading, accuracy, altitude, sensors, tags, source. | Must | Missing location is allowed for sensor-only devices; coordinates outside bounds are rejected. |
| FR-10 | Serve a latest-position snapshot per workspace, filtered by group/bbox. | Must | Snapshot returns one row per device with last seen and status; p95 < 300 ms for 5k devices. |
| FR-11 | Stream live position/sensor/alert events over WebSocket. | Must | Connect with a short-lived token; snapshot then deltas; reconnect resumes with a fresh snapshot. |
| FR-12 | Live map with clustering, status colors, selection, fit, follow, and layer toggles. | Must | 5k markers at 30 fps on a mid-range laptop; updates coalesced to ≤4 Hz per device. |
| FR-13 | Device detail panel with live values and last-seen age. | Must | Opens from map or table; updates live; shows stale/offline state. |
| FR-14 | Track history playback for a device and time range. | Must | Track renders; playhead scrubs; 24 h query p95 < 500 ms. |
| FR-15 | Sensor time-series charts for any numeric sensor key. | Must | Select metric and interval; chart matches API aggregate; empty state is clear. |
| FR-16 | Create/edit/delete geofences by drawing a polygon on the map. | Must | Polygon closes; self-intersection rejected; enter/exit events generated. |
| FR-17 | Generate geofence enter/exit events. | Must | Event fires once per transition; duplicate points do not duplicate events. |
| FR-18 | Alert rules for speed, offline, sensor threshold, and geofence. | Must | Rule validates; disabled rule does not fire; cooldown prevents storms. |
| FR-19 | Alert inbox with status, severity, device, rule, and timestamps; email + webhook delivery. | Must | Alert appears < 2 s after evaluation; acknowledge/resolve; delivery status visible. |
| FR-20 | Outbound webhooks with event selection, HMAC signature, retries, dead-letter. | Must | Signature verifies; retries follow backoff; failed deliveries are visible. |
| FR-21 | Query API for devices, latest, track, series, alerts, and events. | Must | Cursor pagination; stable error shape; OpenAPI matches behavior. |
| FR-22 | API docs and playground with a test key. | Must | Copy-paste examples work; “try it” sends a request and shows the response. |
| FR-23 | Embed builder with name, devices/groups, layers, theme, allowed origins. | Must | Config previews; changes take effect on next token; origin validation enforced. |
| FR-24 | Mint signed, short-lived, read-only embed tokens server-side. | Must | Token expires ≤1 h; wrong origin 403; revoked embed 410; token cannot call write APIs. |
| FR-25 | Embed runtime: iframe route + `embed.js` web component + postMessage events. | Must | Renders in a plain HTML page; responsive; `ready` and `device:click` events fire; no host CSS leakage. |
| FR-26 | Read-only share links for a device or map view with expiry and revocation. | Should | Link opens without login; revoked link stops immediately. |
| FR-27 | Dashboard widget grid with KPI cards, map, alert feed, device table, sensor chart. | Should | Add/remove/resize widgets; layout persists per user; responsive on tablet. |
| FR-28 | CSV export for device list, track, alerts, and sensor series. | Should | Export respects filters and time range; large exports stream. |
| FR-29 | Audit log for auth, members, keys, devices, embeds, webhooks, and destructive actions. | Must | Immutable entries with actor, action, target, IP, timestamp; filterable by admin. |
| FR-30 | Public home page, pricing/legal, docs, demo mode. | Must | Home explains product in < 30 s; demo map works without login; LCP < 2.5 s. |
| FR-31 | Onboarding checklist: create device → copy key → send point → see map. | Must | New user can complete in < 5 min; progress persists. |
| FR-32 | MQTT ingest bridge for device telemetry. | Should | Device publishes to a workspace topic; point follows the same validation/persistence path. |

## Non-functional requirements

| ID | Requirement | Target | Verification |
|---|---|---|---|
| NFR-01 | Ingest latency and reliability | accept p95 < 100 ms; success > 99.5% | k6 + API metrics |
| NFR-02 | Live latency | ingest → browser render p95 < 1.5 s | synthetic device + browser timer |
| NFR-03 | Map performance | 5k markers at ≥30 fps; ≤4 Hz updates per device | spike S-001 + Playwright perf trace |
| NFR-04 | Query latency | 24 h track p95 < 500 ms; latest snapshot p95 < 300 ms | benchmark on seeded data |
| NFR-05 | Availability | 99.9% monthly for API + web | uptime monitor + status page |
| NFR-06 | Tenant isolation | zero cross-tenant reads/writes | RLS test suite + security review |
| NFR-07 | Security | OWASP ASVS L2; hashed keys; HMAC webhooks; rate limits | checklist + pen-test review |
| NFR-08 | Accessibility | WCAG 2.2 AA | axe + keyboard audit |
| NFR-09 | Web performance | LCP < 2.5 s, INP < 200 ms, CLS < 0.1 | Lighthouse CI |
| NFR-10 | Data lifecycle | configurable retention; export/delete within 30 days | retention job + GDPR test |
| NFR-11 | Observability | OTel traces, Prometheus metrics, structured logs, Sentry | dashboards + alerts |
| NFR-12 | Cost | < $150/mo at v1 scale | monthly cloud bill |
| NFR-13 | Compatibility | last 2 versions of Chrome, Firefox, Safari, Edge | Playwright matrix |
| NFR-14 | API lifecycle | `/v1`, additive changes, deprecation ≥90 days | OpenAPI diff + changelog |

## Dependencies and risks

| ID | Item | Impact | Mitigation |
|---|---|---|---|
| RISK-001 | Scope creep across sensors, protocols, billing | Delays v1 | MoSCoW + explicit deferred list; no new FEAT without a catalog row |
| RISK-002 | Map performance at 5k+ live markers | Poor UX, churn | Spike S-001 first; clustering + coalescing; deck.gl exit path |
| RISK-003 | Cross-tenant data leak | Fatal trust loss | RLS + tenant context + automated isolation tests |
| RISK-004 | Embed token theft/replay | Data exposure | ≤1 h TTL, origin allowlist, read-only scopes, revocation |
| RISK-005 | WebSocket fan-out cost | Latency/cost | Coalesce deltas; load test; Centrifugo/Ably exit |
| RISK-006 | Timescale compression/retention operations; Neon lacks compression | Slow queries/disk | Managed Postgres option; runbook; restore drill; Timescale Cloud exit |
| RISK-007 | Vendor lock-in (tiles, auth, hosting) | Migration cost | MapLibre + style abstraction; Better Auth on own DB; Docker |
| RISK-008 | Device protocol fragmentation | Integration delays | HTTP/MQTT first; Traccar adapter later; no raw decoders in v1 |
| RISK-009 | Location-data privacy/regulatory | Legal exposure | Retention, export/delete, DPA, EU region, redaction |
| RISK-010 | Solo-builder capacity | Missed milestones | Slice vertically; stop after each milestone; AI-assisted tasks |

## Release criteria

- [ ] All Must requirements met.
- [ ] No open P0/P1 bugs.
- [ ] TTFLP and live latency verified on staging.
- [ ] RLS isolation suite and embed security tests green.
- [ ] Load test at 100 events/s and 1,000 viewers passes.
- [ ] Backup/restore and rollback rehearsed.
- [ ] Home page, docs, pricing/legal, and status page live.
- [ ] Changelog, version, and runbook updated.

## Open questions

| # | Question | Owner | Default |
|---|---|---|---|
| Q1 | Is MQTT ingest in v1 or M2? | Product | M2; HTTP first |
| Q2 | Do we show real prices or “contact sales” in v1? | Product | Show Free/Pro/Enterprise with “early access” CTA |
| Q3 | Single EU region or US/EU at launch? | Ops | Single EU region |
| Q4 | Do we build a TypeScript SDK in v1? | DevRel | No; OpenAPI + curl/Node examples first |
| Q5 | Is the dashboard widget grid v1 or v1.1? | Product | v1 fixed overview + v1.1 drag/resize |

**Approved by:** `<human>` on `<date>`
