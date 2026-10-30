# Discovery note

> Phase 1 · Gate G1 · Draft for human review. Evidence over opinion. Public sources are labelled; no user interviews have been run yet.

## Problem

Teams that need live location intelligence must assemble ingestion, normalization, time-series and spatial storage, real-time fan-out, map rendering, multi-tenant auth, and embed security. The integration work is repeated in every product, and the failure modes (stale positions, dropped packets, cross-tenant leaks, broken embeds) are expensive.

## Evidence

| # | Source | Type | What it shows | Link |
|---|---|---|---|---|
| E1 | Traccar | Competitor / open source | 200+ GPS protocols, self-hosted or managed from $9.95/mo, REST + WebSocket API, geofences, alerts, reports. Strong protocol coverage; fleet-app UX, not an embed-first developer platform. | https://www.traccar.org/ |
| E2 | Fleetbase | Competitor / commercial | Modular fleet ops with cloud at $29/mo + $5 per driver/vehicle; 8,000+ deployments. Shows willingness to pay, but the product is order/logistics-centric. | https://fleetbase.io/pricing |
| E3 | ThingsBoard | Competitor / open source | 22.6k GitHub stars, device management, telemetry, rule engine, dashboards. Generic IoT, heavy setup; geospatial live tracking is not the core. License moved to BUSL 1.1 in v4.4 (Sep 2026). | https://thingsboard.io/ |
| E4 | EMQX fleet telematics | Infrastructure | MQTT is the de facto telemetry transport; EMQX markets fleet ingestion at millions of connections. License moved to BSL 1.1 from v5.9. Confirms MQTT demand and the risk of depending on a single broker. | https://www.emqx.com/en/solutions/fleet-telematics |
| E5 | OpenVTS architecture write-up | Practitioner | Documents a real pipeline: device → protocol listener → normalize → Redis (latest) + TimescaleDB (history) + PostGIS (spatial) → socket deltas. Validates the separation of live and durable paths. | https://dev.to/rajat_yadav_75dd521e1c76e/how-openvts-engineered-whole-fleet-live-tracking-without-freezinghow-openvts-engineered-51gd |
| E6 | Softechinfra fleet dashboard case study | Practitioner | 60-truck MQTT + TimescaleDB + WebSocket + Mapbox build; 43,200 pings/min; ~12 ms median MQTT-to-browser latency; compression after 14 days cut storage 92%. Validates the stack and retention economics. | https://www.softechinfra.com/blog/fleet-tracking-dashboard-60-trucks-mqtt-timescaledb-52k |
| E7 | MapLibre GL JS | Technology | Open-source, community-governed, GPU-accelerated, no token. Performance guide recommends clustering, URL-hosted GeoJSON, and maxZoom limits for large datasets. | https://maplibre.org/maplibre-gl-js/docs/guides/large-data/ |
| E8 | Mapbox vs MapLibre vs Leaflet 2026 | Technology comparison | MapLibre is the mature open fork; Mapbox GL JS is proprietary and token-bound; Leaflet is lighter but weaker for large vector datasets. | https://www.pkgpulse.com/guides/mapbox-vs-leaflet-vs-maplibre-interactive-maps-2026 |
| E9 | Metabase static embeds | Embed pattern | Signed JWT per page load, short expiry, locked parameters, server-side signing. Confirms the signed-embed-token pattern. | https://www.metabase.com/docs/latest/embedding/static-embedding |
| E10 | Embeddable Tokens API | Embed pattern | Server-side token minting with `securityContext` (user/tenant), row-level security, short-lived scoped tokens, native web component instead of iframe. | https://docs.embeddable.com/deployment/tokens-api |
| E11 | Felt JS SDK | Competitor / embed | iframe-based embed SDK, private-map embed tokens valid 15 minutes, UI controls, initial viewport, React integration. Confirms demand for programmable embeds. | https://developers.felt.com/js-sdk/embed-options |
| E12 | Damoov live GPS API | Competitor / adjacent | REST + WebSocket streaming, location sharing links, embeddable map widgets, driver display names. Adjacent product; mobile-SDK-centric rather than sensor/hardware-agnostic. | https://docs.damoov.com/docs/live-gps-tracking |
| E13 | Better Auth vs Clerk 2026 | Technology comparison | For a new TypeScript multi-tenant SaaS on its own Postgres, Better Auth or Supabase Auth is recommended; Clerk becomes expensive past 50k MAU and holds user data. | https://makerkit.dev/blog/tutorials/better-auth-vs-clerk |
| E14 | Next.js 16 + shadcn/ui + Tailwind v4 | Technology | Current mainstream dashboard stack: Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui on Base UI, Recharts, TanStack Table. | https://github.com/Kiranism/next-shadcn-dashboard-starter |
| E15 | Centrifugo / Ably / Durable Objects | Realtime comparison | Managed and self-hosted pub/sub options exist; custom WebSocket + Redis is viable at v1 scale, with Centrifugo/Ably as exit paths. | https://centrifugal.dev/ |
| E16 | GT06 / Teltonika / JT808 | Device protocols | Low-cost trackers use raw TCP protocols with per-vendor quirks; Traccar maintains production decoders. Confirms that protocol support should be delegated to a gateway, not rebuilt in v1. | https://www.traccar.org/protocols/ |

## Current alternatives

| Segment | Today | Pain | Switching cost |
|---|---|---|---|
| Fleet operator | Traccar, Fleetbase, vendor portal | Dated UX, limited sensor/embed support, per-vehicle pricing | Device reconfiguration, data migration |
| IoT developer | Custom MQTT + Timescale + Mapbox + Auth | 3–6 months of plumbing; on-call burden | Sunk engineering time |
| SaaS product team | Mapbox/Felt embed + separate telemetry backend | Two vendors, two auth models, no unified tenant story | Contract and integration work |
| Integrator | Fork Traccar / white-label | Protocol maintenance, UI rebuild, no API product | Engineering and support cost |

## Users and jobs

| Segment | Job to be done | Trigger | Success |
|---|---|---|---|
| Operations manager | Know where every asset is and what needs attention now | Shift start, incident, customer call | Live map is trustworthy; alert arrives before the customer does |
| Developer | Ship a location feature without building ingestion/storage/realtime | New product requirement, pilot | First point visible in < 5 min; API docs are enough |
| Product team | Add a live map to an existing SaaS | Customer request, upsell | Embed live in < 1 day; no data leakage |
| Integrator | Offer a branded tracking product | New client contract | White-label map and API without forking a codebase |

## Assumptions

| # | Assumption | Confidence | Impact if wrong | Test | Result |
|---|---|---|---|---|---|
| A1 | Five design partners will connect a real HTTP/MQTT source within eight weeks. | medium | fatal | 5 interviews + 3 sandbox integrations | pending |
| A2 | Embeddable live maps are a top-three buying reason for platform teams. | medium | high | 5 interviews; 3 embed prototypes | pending |
| A3 | 90-day raw retention is enough for the Pro plan. | medium | medium | Usage data after launch | pending |
| A4 | 5,000 markers updating at 4 Hz is enough for v1 maps. | high | medium | Spike S-001 (MapLibre load test) | pending |
| A5 | Teams accept a hosted multi-tenant service for location data. | medium | fatal | Security questionnaire + DPA review | pending |
| A6 | Netlify + Vercel + Neon handle 100 events/s and 1,000 viewers within budget. | medium | medium | Spike S-003 + k6 load test | pending |
| A7 | HTTP + MQTT is enough for v1; raw TCP protocols can wait. | medium | high | Partner device inventory | pending |

## Constraints

- Location data is sensitive; retention, export, and deletion must be explicit.
- No protocol decoder sprawl in v1; integrate via HTTP/MQTT or a gateway.
- Infrastructure budget under $150/month for v1.
- One builder plus an AI agent; design is part-time.

## Non-goals

- Hardware, firmware, native mobile apps.
- Route optimization, predictive maintenance, AI dispatch.
- Self-serve billing, enterprise SSO, on-prem/Kubernetes.
- Becoming a general BI or GIS platform.

## Success metrics

- **Primary:** time-to-first-live-position (TTFLP) < 5 minutes for 80% of new workspaces.
- **Activation:** 60% of signups ingest a point within 24 hours.
- **Live quality:** ingest success > 99.5%; live latency p95 < 1.5 s.
- **Embed:** embed render success > 99.9%; median time from embed creation to first host-page render < 1 day.
- **Guardrail:** API error rate < 1%; query p95 < 500 ms; zero cross-tenant leaks.

## Recommendation

- [x] Proceed to product definition (draft; awaiting G1 approval)
- [ ] Pivot: `<new hypothesis>`
- [ ] Stop: `<reason>`

Proceed, but run the five interviews and the MapLibre/WS spikes in parallel with product work. The riskiest assumptions are demand for the API-first/embed layer (A1, A2) and acceptance of hosted location data (A5).

## Open questions

1. Which two verticals should the first home page and demo target — fleet/logistics or IoT/platform? Default: fleet/logistics, because the pain is easier to demonstrate.
2. Is MQTT ingest required for the first demo, or can it land in M2? Default: HTTP first, MQTT in M2.
3. Which region should host v1 data? Default: EU (GDPR-friendly), single region.

**Approved by:** `<human>` on `<date>`
