# T-008 — Live map UI and device drawer

- **Milestone:** M1
- **Feature:** FEAT-010, FEAT-012, FEAT-013
- **Size:** L
- **Risk:** medium
- **Depends on:** T-007
- **Status:** todo

## Goal

A signed-in operator sees every device on a dark MapLibre map, watches markers move live, filters the fleet, and opens a drawer with the selected device's latest state.

## Context

- `project/06-specs/FEAT-010-live-map.md` — behavior contract
- `project/04-adr/0003-maplibre-vector-tiles.md` — map stack
- `project/05-plan.md` — spike S-001

## Acceptance

- [ ] `/map` in the React Router SPA renders a MapLibre GL map with a dark basemap, navigation controls, scale, and attribution.
- [ ] Devices render as status-colored markers; moving devices interpolate between points instead of jumping.
- [ ] The map fits to the fleet on first load and remembers the last viewport per user.
- [ ] Clicking a marker or a row in the side list selects the device and opens a drawer with name, status, last seen, speed, heading, coordinates, and sensor values.
- [ ] Filters cover search, status, and group; the map and list stay in sync; empty results show a clear empty state.
- [ ] At zoom < 10 markers cluster; clicking a cluster zooms in; cluster counts update live.
- [ ] A connection badge shows `live`, `reconnecting`, or `offline`; reconnect is automatic with backoff, handles the Vercel 300 s limit, and offers a manual retry.
- [ ] Devices with no point for > 2 min show `stale`; > 10 min show `offline`; the threshold is a shared constant.
- [ ] The device list is keyboard-navigable and exposes the same selection as the map; the drawer traps focus and closes on `Esc`.
- [ ] 5,000 markers update at ≥ 30 fps on a mid-range laptop (S-001 decision recorded); otherwise use the documented deck.gl/WebGL path.
- [ ] No layout shift on load; the map container has a fixed aspect and a skeleton until ready.
- [ ] Playwright covers: login → map → select device → filter → forced reconnect banner.

## Out of scope

- Track history and playback (M2), geofences (M3), embed (M4), dashboard widget grid (M5).
- Street-level routing, 3D, or satellite imagery.

## Verification

```bash
pnpm --filter @local-matrix/web dev
pnpm --filter @local-matrix/web test
pnpm --filter @local-matrix/web exec playwright test e2e/live-map.spec.ts
pnpm typecheck
```

Manual: open two tabs, run the simulator, confirm both move and the drawer updates without a refresh.

## Notes

Keep map state in a store outside React render loops; update marker sources with `setData`, not by re-rendering components per point. Share the map component with the embed app from `packages/map`; only the chrome differs. The SPA must not hold workspace API keys; it uses the session cookie and stream token only.
