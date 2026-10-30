# ADR-0003 — MapLibre GL JS with vector tiles

- **Status:** accepted
- **Date:** 2026-10-30
- **Deciders:** Udith Sandaruwan
- **Supersedes:** none

## Context

The live map is the core surface. It must render up to 5,000 markers with frequent updates, support clustering, geofences, tracks, heatmaps, custom dark styling, and be embeddable in third-party sites without exposing a vendor token. The map must not create a licensing or pricing trap as the product grows.

## Decision

Use MapLibre GL JS 6 with vector tiles and a custom style.

- React integration via `@vis.gl/react-maplibre`.
- One GeoJSON source for devices with built-in clustering; `setData` on a throttled frame (≤4 Hz), not React markers.
- Separate sources for tracks, geofences, and heatmaps.
- Tile provider: MapTiler for v1 speed; Protomaps/PMTiles on object storage is the self-host exit.
- Style tokens live in `packages/map`; the embed app reuses the same style.

## Alternatives

| Option | Why not chosen |
|---|---|
| Mapbox GL JS | Proprietary license, access token, usage-based pricing, and vendor lock-in; performance edge does not justify it |
| Leaflet | Lightweight and familiar, but weaker for large vector datasets, rotation, and GPU rendering |
| OpenLayers | Powerful GIS toolkit, but heavier API and more ceremony for a product map |
| Google Maps | Strong basemap, but expensive at scale, limited styling, and a token/terms burden |

## Consequences

**Positive**
- Open-source BSD-2 license; no per-map-view token cost.
- GPU rendering, vector styling, globe/3D path, and a healthy plugin ecosystem.
- The same map code powers the console, demo, and embed.

**Negative**
- MapLibre initialization can be slower than Mapbox for small datasets; mitigate with lazy loading.
- Some advanced features (terrain, 3D buildings) are less polished than Mapbox.
- Tile provider is still a dependency; keep the style provider-agnostic.

**Neutral**
- Clustering and data coalescing matter more than the library choice at 5k markers.

## Revisit if

- 5k markers cannot hold 30 fps after clustering and coalescing; evaluate deck.gl layers.
- A tile provider contract becomes a cost or reliability problem; move to Protomaps.
- MapLibre’s WebGPU path matures and materially improves large-layer performance.

## References

- `project/06-specs/FEAT-010-live-map.md`
- `project/05-plan.md` spike S-001
