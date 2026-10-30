# Project brief

> Phase 0 · Gate G0 · Draft for human review. Keep under one page.

## Identity

- **Project:** Local Matrix
- **Owner:** Udith Sandaruwan
- **Date:** 2026-10-30
- **One-liner:** Local Matrix is a real-time geospatial telemetry platform that ingests GPS and sensor data, visualizes it on a live map, and distributes it through APIs, webhooks, and embeddable maps.

## Problem

Teams building fleet, logistics, field-service, or IoT products must stitch together device ingestion, a time-series and spatial database, WebSocket fan-out, map rendering, multi-tenant auth, and embed security. This typically takes three to six months, and every team rebuilds the same fragile pipeline.

Existing tools force a trade-off:

- **Device servers** such as Traccar are strong on protocols but are fleet apps first, with a dated UI and no embed-first developer platform.
- **IoT platforms** such as ThingsBoard are generic and heavy; geospatial live tracking is one dashboard among many.
- **Map products** such as Mapbox and Felt render beautifully but do not ingest, normalize, or store device telemetry.
- **Mobile telematics APIs** such as Damoov are SDK-centric and closed to arbitrary hardware and sensors.

## Outcome

When Local Matrix works, a developer can send one GPS point through an API and see it move on a live map in under five minutes. An operator can watch a fleet and its sensor readings in one console. A partner can embed the same live map in their product with a signed, read-only token. The platform also forwards normalized data to other systems through APIs and webhooks, so it works as a telemetry middleware layer, not only a dashboard.

We will know because **time-to-first-live-position (TTFLP)** moves from “days of setup” to **under 5 minutes** for 80% of new workspaces.

## Users

| Segment | Job to be done | Current workaround |
|---|---|---|
| Fleet / operations manager | See every vehicle and sensor in real time; act on exceptions | Spreadsheets, vendor portals, Traccar/Fleetbase |
| IoT / platform developer | Ingest device data and expose it to an app without building the pipeline | Custom MQTT + Timescale + WebSocket + Mapbox stack |
| SaaS product team | Embed a branded live map without becoming a GIS company | Mapbox/Felt embeds plus a separate telemetry backend |
| System integrator / reseller | Offer a white-label tracking product to clients | Fork Traccar, maintain device protocols, build a UI |

## Scope

**In scope for v1**

- HTTP ingest API with API keys, scopes, idempotency, and batch support.
- Device registry and canonical telemetry schema for position plus arbitrary sensors.
- Live map with clustering, status, device detail, and realtime WebSocket updates.
- Track history playback and sensor time-series charts.
- Geofences, alert rules, alert inbox, email and webhook notifications.
- Query API, OpenAPI docs, API playground, and outbound webhooks with HMAC signatures.
- Embeddable live map: iframe, `embed.js` web component, signed short-lived tokens, origin allowlist.
- Multi-tenant workspaces, roles, audit log, and Postgres row-level security.
- Public home page, pricing/legal pages, docs, login/signup, onboarding, and a no-login demo.

**Out of scope**

- Native iOS/Android apps and hardware/firmware — because v1 proves the platform, not the device.
- 200+ raw TCP device protocols (GT06, Teltonika, JT808) — because a gateway/Traccar adapter is cheaper and safer than protocol sprawl.
- Route optimization, predictive maintenance, AI dispatch, and video telematics — because they are separate products.
- Billing and self-serve payments — plans are assigned manually in v1.
- On-prem, Kubernetes, SAML SSO, and regional data residency — enterprise work after demand is proven.

## Constraints

- **Deadline:** none fixed; target first demoable slice in 6–8 weeks.
- **Budget:** under $150/month infrastructure for v1.
- **Stack:** TypeScript, React 19 + Vite, NestJS 11 + Fastify, PostgreSQL 17 + PostGIS + TimescaleDB, Prisma 7, Redis 7, MapLibre GL JS 6, Netlify + Vercel, Docker locally, Neon later.
- **Compliance:** GDPR-ready handling of location data; no regulated health/financial data.
- **Team:** one full-stack builder plus an AI coding agent; part-time design support.

## Success and stop conditions

- **Success:** TTFLP < 5 minutes for 80% of new workspaces; 60% of signups ingest a point within 24 hours.
- **Guardrail:** ingest success > 99.5%; live latency p95 < 1.5 s; zero cross-tenant data leaks.
- **Stop if:** after eight weeks, fewer than three design partners will connect a real data source or commit to an embed pilot.

## Riskiest assumption

Teams prefer an **API-first telemetry + embed layer** over adopting an all-in-one fleet app. Confidence: medium. Impact if wrong: high. Cheap test: five developer/operator interviews and three sandbox integrations in the first two weeks.

## Decision

- [x] Proceed to discovery (draft; awaiting G0 approval)
- [ ] Pivot: `<new hypothesis>`
- [ ] Stop: `<reason>`

**Approved by:** `<human>` on `<date>`
