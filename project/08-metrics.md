# 08 — Metrics

Track outcomes, not activity. Baselines are unmeasured until M1 staging; targets come from the PRD.

## Product

| Metric | Baseline | Target | Current | Source |
|---|---|---|---|---|
| Time to first live point (TTFLP) | unmeasured | < 5 min | — | onboarding timer, T-010 |
| Activation (signup → first point in 24 h) | unmeasured | ≥ 40% | — | product events |
| Weekly active workspaces | 0 | 10 by end of M5 | — | sessions |
| Devices with a point in 24 h | 0 | 100 by end of M6 | — | telemetry |
| Ingest success rate | unmeasured | > 99.5% | — | API metrics |
| Ingest p95 latency | unmeasured | < 100 ms | — | API metrics |
| Live latency (ingest → render) | unmeasured | p95 < 1.5 s | — | synthetic probe |
| Map frame rate at 5k devices | unmeasured | ≥ 30 fps | — | Playwright perf trace |
| 24 h track query p95 | unmeasured | < 500 ms | — | benchmark |
| Cross-tenant leaks | 0 | 0 (guardrail) | 0 | RLS suite + review |
| Embed views (7-day) | 0 | 10 live embeds by end of M4 | — | embed runtime |
| Support tickets per 10 workspaces | unmeasured | < 3/month | — | support log |

## Delivery

| Metric | Value | Trend |
|---|---|---|
| Deployment frequency | unmeasured until T-012 | |
| Lead time for change | unmeasured | |
| Change failure rate | unmeasured | |
| Time to restore | unmeasured | |

## Agent efficiency

| Metric | Value | Notes |
|---|---|---|
| Tokens per merged task | unmeasured | per task, not per request |
| Clarification turns per task | unmeasured | target ≤1 |
| Rework rate | unmeasured | PRs changed after review |
| Handoffs per completed task | unmeasured | 1 for L |

## Quality gates

| Check | Target | Current |
|---|---|---|
| `pnpm lint` | pass | — |
| `pnpm typecheck` | pass | — |
| `pnpm test` | pass | — |
| Playwright E2E | pass, 3 consecutive runs | — |
| RLS isolation suite | pass | — |
| `./scripts/doctor.sh` | pass | — |
| `./scripts/token-audit.sh --strict` | pass | — |
| Lighthouse (home, console) | LCP < 2.5 s, INP < 200 ms, CLS < 0.1 | — |
| axe WCAG 2.2 AA | no critical issues | — |

## Releases

| Version | Date | Notes | Rollback? |
|---|---|---|---|
| `v0.1.0` | planned after M1 | First live point on staging | image tag + compose |
| `v0.2.0` | planned after M3 | History, sensors, alerts, webhooks | image tag + compose |
| `v1.0.0` | planned after M6 | Public launch | image tag + backup restore |
