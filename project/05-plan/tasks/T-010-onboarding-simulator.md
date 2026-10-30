# T-010 — Onboarding checklist and demo simulator

- **Milestone:** M1
- **Feature:** FEAT-063, FEAT-064
- **Size:** M
- **Risk:** low
- **Depends on:** T-008, T-009
- **Status:** todo

## Goal

A new user is guided from signup to a moving marker in under five minutes, and anyone can populate a demo workspace with realistic moving devices without touching production data.

## Context

- `project/02-prd.md` — first-run journey and TTFLP target
- `project/05-plan.md` — M1 demo script
- `project/06-specs/FEAT-010-live-map.md` — map states

## Acceptance

- [ ] The onboarding checklist shows: create device, copy API key, send first point, see it on the map.
- [ ] Each step auto-completes from real events (device created, key created, first ingest, first render), not from a client-only click.
- [ ] Progress persists per user and workspace; the checklist can be dismissed and reopened from help.
- [ ] The first-point step includes a copyable `curl` with the real key prefix redacted and a "send test point" button for the selected device.
- [ ] Empty map and empty device list show the next action, not a blank canvas.
- [ ] `pnpm demo:seed` creates a separate `Demo` workspace with three devices, 24 h of plausible track data, and sensor values; it is idempotent and uses Prisma.
- [ ] `pnpm demo:simulate` moves the demo devices on a loop through the normal ingest path; it never writes to a non-demo workspace.
- [ ] Demo data is labeled and can be deleted with `pnpm demo:reset`; no demo row leaks into a real workspace.
- [ ] A timed manual run of the full first-run journey is < 5 min; the measured value is recorded in `project/08-metrics.md`.
- [ ] Playwright covers the checklist completing after a simulated first point.

## Out of scope

- Public marketing demo on the home page (T-050), invite teammates, sample datasets for every industry.
- Background worker scheduling; the simulator may be a script for M1.

## Verification

```bash
pnpm demo:seed
pnpm demo:simulate --duration 60s
pnpm --filter @local-matrix/web exec playwright test e2e/onboarding.spec.ts
pnpm typecheck
```

Manual: create a fresh account and time signup → moving marker; record the result.

## Notes

Reuse the simulator for M6 load tests by adding a rate flag. Keep the demo workspace flagged in the database (`is_demo`) so exports, billing, and metrics can exclude it. The simulator calls the public ingest API, not the database, so it exercises the real path.
