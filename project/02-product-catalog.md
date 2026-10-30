# Product catalog

> Phase 2+ · Living index. IDs never change. One row per capability/feature.
> Status: `idea → specified → planned → in-progress → shipped → deprecated` (or `dropped`).

## Capabilities

| ID | Capability | Outcome | Owner | Status |
|---|---|---|---|---|
| CAP-001 | Ingestion & normalization | Any device/app can send GPS + sensor data through one contract | Platform | planned |
| CAP-002 | Live operations | Operators see every asset and exception in real time | Product | planned |
| CAP-003 | History & analytics | Teams can investigate what happened and export it | Product | planned |
| CAP-004 | Platform APIs & integrations | Developers can build on and forward normalized data | Platform | planned |
| CAP-005 | Embeddable maps | Partners can put a branded live map inside their product | Platform | planned |
| CAP-006 | Accounts & tenancy | Teams, roles, isolation, audit, and plan limits | Platform | planned |
| CAP-007 | Public web & onboarding | Visitors understand the product and reach first value fast | Growth | planned |

## Features

| ID | Capability | Feature | Priority | Status | Spec | Release |
|---|---|---|---|---|---|---|
| FEAT-001 | CAP-001 | HTTP ingest API (single + batch) | Must | specified | `06-specs/FEAT-001-ingest-api.md` | v0.1 |
| FEAT-002 | CAP-001 | MQTT ingest bridge | Should | idea | pending | v0.2 |
| FEAT-003 | CAP-001 | Device registry | Must | planned | pending | v0.1 |
| FEAT-004 | CAP-001 | Canonical telemetry schema | Must | specified | `06-specs/FEAT-001-ingest-api.md` | v0.1 |
| FEAT-005 | CAP-001 | API keys & scopes | Must | planned | pending | v0.1 |
| FEAT-006 | CAP-001 | Idempotency & dedupe | Must | specified | `06-specs/FEAT-001-ingest-api.md` | v0.1 |
| FEAT-010 | CAP-002 | Live map | Must | specified | `06-specs/FEAT-010-live-map.md` | v0.1 |
| FEAT-011 | CAP-002 | Realtime WebSocket stream | Must | specified | `06-specs/FEAT-010-live-map.md` | v0.1 |
| FEAT-012 | CAP-002 | Device detail panel | Must | planned | pending | v0.1 |
| FEAT-013 | CAP-002 | Map layers & filters | Must | planned | pending | v0.1 |
| FEAT-014 | CAP-002 | Geofences | Must | planned | pending | v0.2 |
| FEAT-015 | CAP-002 | Alerts & notifications | Must | planned | pending | v0.2 |
| FEAT-020 | CAP-003 | Track history playback | Must | planned | pending | v0.2 |
| FEAT-021 | CAP-003 | Sensor time-series charts | Must | planned | pending | v0.2 |
| FEAT-022 | CAP-003 | Device table & filters | Must | planned | pending | v0.1 |
| FEAT-023 | CAP-003 | CSV export | Should | idea | pending | v0.2 |
| FEAT-024 | CAP-003 | Dashboard widget grid | Should | idea | pending | v0.3 |
| FEAT-030 | CAP-004 | Query API | Must | planned | pending | v0.2 |
| FEAT-031 | CAP-004 | Outbound webhooks | Must | planned | pending | v0.2 |
| FEAT-032 | CAP-004 | API docs & playground | Must | planned | pending | v0.2 |
| FEAT-033 | CAP-004 | Public share links | Should | idea | pending | v0.2 |
| FEAT-034 | CAP-004 | Traccar/gateway adapter | Could | idea | pending | post-v1 |
| FEAT-040 | CAP-005 | Embed builder | Must | specified | `06-specs/FEAT-040-embeddable-map.md` | v0.3 |
| FEAT-041 | CAP-005 | Signed embed tokens | Must | specified | `06-specs/FEAT-040-embeddable-map.md` | v0.3 |
| FEAT-042 | CAP-005 | Embed runtime (iframe + web component) | Must | specified | `06-specs/FEAT-040-embeddable-map.md` | v0.3 |
| FEAT-043 | CAP-005 | Host postMessage API | Must | specified | `06-specs/FEAT-040-embeddable-map.md` | v0.3 |
| FEAT-044 | CAP-005 | Embed analytics | Could | idea | pending | post-v1 |
| FEAT-050 | CAP-006 | Auth & sessions | Must | planned | pending | v0.1 |
| FEAT-051 | CAP-006 | Workspaces & roles | Must | planned | pending | v0.1 |
| FEAT-052 | CAP-006 | Audit log | Must | planned | pending | v0.2 |
| FEAT-053 | CAP-006 | Plans & limits (manual) | Must | idea | pending | v0.2 |
| FEAT-054 | CAP-006 | Billing & payments | Could | dropped (v1) | — | post-v1 |
| FEAT-060 | CAP-007 | Home page | Must | planned | pending | v0.3 |
| FEAT-061 | CAP-007 | Pricing & legal pages | Must | planned | pending | v0.3 |
| FEAT-062 | CAP-007 | Docs site | Must | planned | pending | v0.2 |
| FEAT-063 | CAP-007 | Demo mode & simulator | Must | planned | pending | v0.1 |
| FEAT-064 | CAP-007 | Onboarding checklist | Must | planned | pending | v0.1 |

## Non-functional requirements

| ID | Requirement | Target | Status |
|---|---|---|---|
| NFR-001 | Ingest latency/reliability | p95 < 100 ms; > 99.5% success | active |
| NFR-002 | Live latency | p95 < 1.5 s | active |
| NFR-003 | Map performance | 5k markers ≥30 fps; ≤4 Hz/device | active |
| NFR-004 | Query latency | 24 h track p95 < 500 ms | active |
| NFR-005 | Availability | 99.9% monthly | active |
| NFR-006 | Tenant isolation | zero cross-tenant leaks | active |
| NFR-007 | Security | OWASP ASVS L2 | active |
| NFR-008 | Accessibility | WCAG 2.2 AA | active |
| NFR-009 | Web performance | LCP < 2.5 s, INP < 200 ms, CLS < 0.1 | active |
| NFR-010 | Data lifecycle | retention, export, delete | active |
| NFR-011 | Observability | OTel + metrics + logs + Sentry | active |
| NFR-012 | Cost | < $150/mo at v1 scale | active |
| NFR-013 | Compatibility | last 2 browser versions | active |
| NFR-014 | API lifecycle | `/v1`, 90-day deprecation | active |

## Risks

| ID | Risk | Impact | Mitigation | Status |
|---|---|---|---|---|
| RISK-001 | Scope creep | Delays v1 | MoSCoW + deferred list | open |
| RISK-002 | Map performance at scale | Poor UX | Spike S-001, clustering, coalescing | open |
| RISK-003 | Cross-tenant leak | Fatal | RLS + isolation tests | open |
| RISK-004 | Embed token abuse | Data exposure | TTL, origin allowlist, read-only | open |
| RISK-005 | WebSocket fan-out cost | Latency/cost | Load test, Centrifugo exit | open |
| RISK-006 | Timescale operations; Neon lacks compression | Slow queries/disk | Managed PG, runbook, Timescale Cloud exit | open |
| RISK-007 | Vendor lock-in | Migration cost | MapLibre, own DB, Docker | open |
| RISK-008 | Protocol fragmentation | Integration delays | HTTP/MQTT first | open |
| RISK-009 | Location-data privacy | Legal exposure | Retention, DPA, EU region | open |
| RISK-010 | Solo-builder capacity | Missed milestones | Vertical slices, stop points | open |

## Dropped / deferred

| ID | Item | Reason | Revisit when |
|---|---|---|---|
| FEAT-002 | MQTT ingest | HTTP proves the loop first | M2 or first hardware partner |
| FEAT-023 | CSV export | Not needed for first demo | M2 |
| FEAT-024 | Dashboard widget grid | Fixed overview first | After M4 |
| FEAT-034 | Traccar/gateway adapter | Avoid protocol sprawl | First raw-TCP partner |
| FEAT-044 | Embed analytics | Prove embeds first | 10 live embeds |
| FEAT-054 | Billing | Manual plans are enough | Paid demand > 10 workspaces |
| — | Native mobile apps | Platform first | Post-v1 |
| — | SAML/SCIM/on-prem | Enterprise work | First enterprise contract |

## Rules

- Every spec, task, commit, and changelog entry references a `FEAT-###`.
- Do not reuse IDs.
- Do not add a feature without a priority and a status.
- The catalog is scope; the plan is sequence; the tracker is execution.
- A feature marked `Must` for v0.1 must have a spec before G4.
