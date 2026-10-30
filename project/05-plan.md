# Development plan

> Phase 4 · Gate G4 · Draft for human review. Outcomes and sequence, not a Gantt chart.

## Summary

- **Target:** a public v1 that proves connect → normalize → visualize → distribute, with a home page, console, API, and embeddable map.
- **Capacity:** one full-time builder + AI agent; part-time design. Estimates are ranges, not commitments.
- **Critical path:** `T-001 → T-002 → T-003 → T-006 → T-007 → T-008 → T-011 → T-012`.
- **First demo:** a new user signs up, creates a device, copies an API key, sends a point, and sees it move on a live map in under five minutes.

## Milestones

### M1 — First live point

- **Outcome:** a signed-in user can create a workspace/device, ingest a point with an API key, and watch it appear on a live map.
- **Demo:** signup → device → copy `curl` → run it → marker moves; second browser tab shows the same live state.
- **Exit:** E2E green; RLS isolation test green; staging deployed; no P0; TTFLP measured < 5 min; all M1 feature PRs merged to `dev-*` and `main` left untouched until phase approval.
- **Tasks:** `T-001`–`T-012`.

### M2 — History and sensors

- **Outcome:** an operator can inspect a device’s track, scrub playback, chart any numeric sensor, filter the device table, and export CSV.
- **Demo:** select 24 h → track draws → playhead moves → temperature chart syncs → export CSV.
- **Exit:** 24 h track p95 < 500 ms on seeded data; export respects filters; no P0.
- **Tasks:** `T-020`–`T-026`.

### M3 — Alerts and geofences

- **Outcome:** an operator can draw a geofence, create speed/offline/sensor/geofence rules, receive an alert, and forward it to a webhook.
- **Demo:** draw a polygon → drive a simulated device through it → alert appears → webhook receives a signed payload.
- **Exit:** enter/exit fires once; cooldown prevents storms; webhook retries and dead-letter visible.
- **Tasks:** `T-030`–`T-035`.

### M4 — Platform APIs and embed

- **Outcome:** a developer can read the docs, try the API, create an embed, mint a signed token, and render the live map in a plain HTML page.
- **Demo:** docs → playground request → embed builder → `iframe` and `<local-matrix-map>` both render; host receives `device:click`.
- **Exit:** OpenAPI matches behavior; expired/wrong-origin tokens fail safely; embed E2E green.
- **Tasks:** `T-040`–`T-046`.

### M5 — Public home and product polish

- **Outcome:** a visitor understands the product in under 30 seconds, sees a live demo, can sign up, and lands in a polished console.
- **Demo:** home → live demo → pricing → signup → onboarding → console; dark/light themes; dashboard widgets.
- **Exit:** LCP < 2.5 s; WCAG 2.2 AA audit; no broken links; legal pages present.
- **Tasks:** `T-050`–`T-056`.

### M6 — Hardening and release

- **Outcome:** v1 is operable: load-tested, secured, observable, backed up, deployable, and documented.
- **Demo:** staging load test, incident drill, restore drill, production smoke test.
- **Exit:** release criteria in the PRD met; runbook tested; changelog and version tagged.
- **Tasks:** `T-060`–`T-065`.

## Task table

| ID | Task | Milestone | Size | Depends | Parallel-safe | Status |
|---|---|---|---|---|---|---|
| T-001 | Monorepo scaffold + tooling + CI | M1 | M | — | yes | todo |
| T-002 | Local infra: Postgres/PostGIS/Timescale + Redis | M1 | M | T-001 | no | todo |
| T-003 | Schema, hypertable, indexes, RLS | M1 | L | T-002 | no | todo |
| T-004 | API skeleton: config, errors, health, OpenAPI | M1 | M | T-001 | yes | todo |
| T-005 | Devices + API keys + auth middleware | M1 | M | T-003, T-004 | no | todo |
| T-006 | Ingest API single + batch + idempotency | M1 | L | T-003, T-005 | no | todo |
| T-007 | WebSocket stream + Redis fan-out | M1 | L | T-006 | no | todo |
| T-008 | Live map UI + device drawer | M1 | L | T-007 | no | todo |
| T-009 | Auth + workspace + onboarding guard | M1 | L | T-003 | yes | todo |
| T-010 | Onboarding checklist + demo simulator | M1 | M | T-008, T-009 | no | todo |
| T-011 | E2E + RLS isolation + contract tests | M1 | M | T-008, T-009, T-010 | no | todo |
| T-012 | Staging deploy + smoke + rollback | M1 | M | T-011 | no | todo |
| T-020 | Track API + downsampling | M2 | M | T-006 | yes | todo |
| T-021 | Device detail + track playback UI | M2 | L | T-020 | no | todo |
| T-022 | Sensor series API + charts | M2 | M | T-020 | yes | todo |
| T-023 | Device table + filters | M2 | M | T-005 | yes | todo |
| T-024 | CSV export | M2 | S | T-020, T-023 | yes | todo |
| T-025 | MQTT ingest bridge (Should) | M2 | L | T-006 | no | todo |
| T-026 | History E2E + perf test | M2 | M | T-021, T-022 | no | todo |
| T-030 | Geofence CRUD + draw UI | M3 | L | T-008 | no | todo |
| T-031 | Geofence transition worker | M3 | M | T-030 | no | todo |
| T-032 | Alert rules CRUD + evaluator | M3 | L | T-031 | no | todo |
| T-033 | Alert inbox + email | M3 | M | T-032 | yes | todo |
| T-034 | Webhooks + HMAC + retries + dead-letter | M3 | L | T-032 | yes | todo |
| T-035 | Alerts E2E + delivery tests | M3 | M | T-033, T-034 | no | todo |
| T-040 | Query API polish + OpenAPI + Scalar | M4 | M | T-020, T-022 | yes | todo |
| T-041 | API playground | M4 | M | T-040 | yes | todo |
| T-042 | Embed builder UI | M4 | M | T-008 | yes | todo |
| T-043 | Embed token service + CSP/origin | M4 | M | T-042 | no | todo |
| T-044 | Embed runtime: Vite iframe app | M4 | L | T-043 | no | todo |
| T-045 | `embed.js` web component + postMessage | M4 | M | T-044 | no | todo |
| T-046 | Embed demo page + E2E | M4 | M | T-045 | no | todo |
| T-050 | Home page | M5 | L | T-008 | yes | todo |
| T-051 | Pricing, legal, docs pages | M5 | M | T-040 | yes | todo |
| T-052 | Auth polish + OAuth | M5 | M | T-009 | yes | todo |
| T-053 | Dashboard widget grid | M5 | L | T-023, T-033 | no | todo |
| T-054 | Design tokens + dark/light themes | M5 | M | T-008 | yes | todo |
| T-055 | SEO, OG images, sitemap | M5 | S | T-050 | yes | todo |
| T-056 | Accessibility audit + fixes | M5 | M | T-050, T-053 | no | todo |
| T-060 | Load test + tuning (ingest, WS, map) | M6 | M | T-007, T-026 | no | todo |
| T-061 | Security review + RLS/embed/webhook tests | M6 | M | T-043, T-034 | no | todo |
| T-062 | Observability: metrics, traces, alerts | M6 | M | T-012 | yes | todo |
| T-063 | Backups, restore drill, runbook | M6 | M | T-012 | yes | todo |
| T-064 | CI/CD + production deploy | M6 | M | T-060, T-061 | no | todo |
| T-065 | Release docs, changelog, version | M6 | S | T-064 | no | todo |

## M1 slices

M1 is the only milestone detailed task-by-task. Later milestones will change after the first demo.

| Slice | Outcome | Tasks |
|---|---|---|
| S1 — Walking skeleton | Repo, local infra, schema/RLS, health check | T-001, T-002, T-003 |
| S2 — Ingest | Device + key + single/batch ingest persists and publishes | T-004, T-005, T-006 |
| S3 — Live | WebSocket snapshot/deltas + MapLibre live map | T-007, T-008 |
| S4 — Onboarding | Auth, workspace, checklist, E2E, staging | T-009, T-010, T-011, T-012 |

S1 is the first demoable slice: `curl` a point, query it, and see the row + Redis event. It is intentionally ugly and has no UI.

## Branch and merge workflow

Long-lived branches: `main`, `dev-frontend`, `dev-backend`, `prod-frontend`, `prod-backend`.

- Feature work branches from the matching `dev-*` branch, makes several atomic Conventional Commits, pushes, and opens a PR with `gh pr create`.
- Feature PRs merge to `dev-*` with `gh pr merge --merge --delete-branch` after CI and review.
- Full-stack features use two PRs: backend first, then frontend; shared contract changes land on `dev-backend` first.
- `main` receives `dev-frontend` and `dev-backend` only at phase/product completion, after G5/G6 and human approval.
- `prod-frontend` and `prod-backend` receive `main` and deploy only when the human explicitly says “merge to production and deploy.”
- Never commit directly to `main`, `dev-*`, or `prod-*`; never force-push a shared branch.
- Release tags come from `main`; production deploy IDs are recorded in release notes.

The full command sequence is in `docs/07-git-workflow.md` and the hard rules in `project/rules/git-workflow.md`.

## Risks

| ID | Risk | Impact | Mitigation | Owner |
|---|---|---|---|---|
| RISK-001 | Scope creep | Delays v1 | MoSCoW + deferred list; no new FEAT without catalog row | Product |
| RISK-002 | Map performance | Poor UX | S-001 before T-008; clustering + coalescing; deck.gl exit | Platform |
| RISK-003 | Cross-tenant leak | Fatal | RLS + T-011 isolation suite + M6 review | Platform |
| RISK-004 | Embed token abuse | Data exposure | TTL, origin allowlist, read-only, revocation, T-061 | Platform |
| RISK-005 | WS fan-out | Latency/cost | S-003; 4 Hz coalescing; Centrifugo exit | Platform |
| RISK-006 | Timescale ops | Slow queries/disk | S-002; managed PG exit; runbook | Ops |
| RISK-007 | Vendor lock-in | Migration cost | MapLibre; own DB; Docker; provider-agnostic style | Platform |
| RISK-008 | Protocol fragmentation | Integration delays | HTTP/MQTT only; Traccar adapter later | Product |
| RISK-009 | Location privacy | Legal exposure | Retention, export/delete, DPA, EU region | Product |
| RISK-010 | Solo capacity | Missed milestones | Vertical slices; stop after each milestone; AI-assisted | Owner |
| RISK-011 | Vercel WebSocket connections close at 300–800 s | Reconnect churn, brief stale maps | Reconnect before limit with `since`; snapshot resync; measure reconnect rate | Platform |
| RISK-012 | Neon lacks Timescale compression | Storage cost at 90-day retention | Monitor storage; rollups; Timescale Cloud or colder raw tier exit | Ops |
| RISK-013 | Cross-site cookies/CORS between Netlify and Vercel | Login loops or insecure cookies | Same parent domain, exact CORS allowlist, staging E2E | Platform |
| RISK-014 | Vercel Daemons are public beta | Worker unavailable | Container fallback on Railway/Fly with the same image | Ops |

## Spikes

| ID | Question | Time-box | Decision unblocked | Result |
|---|---|---|---|---|
| S-001 | Can MapLibre hold 5k markers at 4 Hz and ≥30 fps on a mid-range laptop? | 1 day | T-008 map approach; deck.gl or not | pending |
| S-002 | Does the Timescale/PostGIS schema on Neon and local Docker return a 24 h track and 30-day aggregates under target? | 1 day | T-003 indexes, chunk interval, aggregates | pending |
| S-003 | Can Vercel WebSockets + Redis fan-out hold 1k clients with p95 < 1.5 s across 300 s reconnects? | 1 day | T-007 gateway vs Ably/Centrifugo | pending |
| S-004 | Do signed tokens + CSP `frame-ancestors` work across Chrome/Safari/Firefox embeds? | 0.5 day | T-043/T-044 token and frame model | pending |
| S-005 | Does Better Auth’s organization plugin integrate cleanly with NestJS + Fastify + Prisma 7 + RLS? | 1 day | T-009 auth integration; JWT fallback | pending |
| S-006 | Is Mosquitto enough for the M2 bridge, or is EMQX needed? | 1 day | T-025 broker choice | pending |

## Estimates and buffers

| Milestone | Known work (days) | Confidence | Notes |
|---|---|---|---|
| M1 | 13–17 | medium | Auth, RLS, Prisma migrations, and Vercel WS are the unknowns |
| M2 | 7–10 | medium | Query/downsampling performance |
| M3 | 8–12 | medium | Alert semantics and webhook retries |
| M4 | 8–12 | medium | Embed security and cross-browser CSP |
| M5 | 7–10 | medium | Design/content effort |
| M6 | 6–8 | medium | Load/security/release |
| **Total** | **49–69** | medium | ~10–14 weeks full-time; 4–6 months part-time |

Buffers, shown separately:

- Integration and review: +25%.
- Interruptions/support: +10–20%.
- Release: 2 days.
- Do not treat these ranges as commitments; re-estimate after M1.

## Review and release

- **Reviewer:** Udith Sandaruwan (human) + AI code review on every diff.
- **Branch gate:** feature PRs merge to `dev-*` only after checks and review; `main` only at phase/product completion; `prod-*` and deploy only on explicit human instruction.
- **Required checks:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, Playwright E2E, `prisma validate`, migration check, `./scripts/doctor.sh`, `./scripts/token-audit.sh --strict`, dependency audit.
- **Release window:** after M6 exit criteria; no fixed date.
- **Rollback:** Netlify instant rollback + Vercel previous deployment; migrations are forward-only, so take a Neon branch/backup before release; restore drill in M6.
- **Docs to update:** README, `project/07-runbook.md`, `project/08-metrics.md`, OpenAPI, changelog.

## Open questions

| # | Question | Default |
|---|---|---|
| Q1 | Is MQTT in v1 or M2? | M2; HTTP first |
| Q2 | Is the dashboard widget grid in v1 or v1.1? | Fixed overview in v1; grid in M5 if time allows |
| Q3 | Do we build a TypeScript SDK? | No; OpenAPI + curl/Node examples |
| Q4 | Which tile provider for production? | MapTiler; Protomaps exit |
| Q5 | Which email provider? | Resend |
| Q6 | Where does the worker run if Vercel Daemons stay in beta or are blocked? | Railway container with the same image |

**Approved by:** `<human>` on `<date>`
