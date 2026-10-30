# UI design reference — dashboard visual language

Owner-approved visual direction for `apps/web` (console) and `apps/embed`. Derived from three reference screenshots the owner provided: a Cyfe-style dark KPI dashboard, a modern dark flight-tracking dashboard, and a Kibana-3-style dark analytics grid.

## Core language

- **Dark widget dashboard.** Near-black app background (`#0b0e14`-range), layered dark surface cards with subtle borders. Widgets are the atomic unit: every panel is a card with a header, body, and optional footer.
- **Widget chrome.** Card headers use a small uppercase title left, control icons right (collapse/expand chevron, settings, remove). Collapsible and re-orderable from M5.
- **Sidebar.** Icon-first vertical rail (collapsible; icons + tooltips when collapsed, icons + labels when expanded). Color the active item with the accent.
- **Time window chips.** A row of relative chips (`5m 15m 1h 6h 12h 24h 7d 30d 90d`) plus custom range; the selected chip is a bright accent pill. Auto-refresh toggle nearby.
- **KPI cards.** Big value, colored delta with arrow (`▲ 10%` green / `▼ 10%` red), small-dot + uppercase label. Sparkline/area chart embedded under the number.
- **Tables.** Dense rows, monospaced/tabular numerals, sort arrows in headers, cursor pagination footer.

## Map treatment

- Dark vector basemap (MapLibre), subdued land/water contrast, muted country borders.
- Device markers as colored pills/dots by status; cluster at low zoom.
- Selected device: accent glow pulse; track playback draws an accent polyline with faded endpoints (route-card style).

## Charts

- Rounded bars, gradient area fills under lines, glowing line strokes, minimal gridlines, no chart junk.
- Grouped series with a legend row (dot + label).
- Big-number/stat widgets (like the "82% efficiency" card): hero value with subtle gradient, supporting caption, optional pill badge ("56 parameters").

## Palette

| Token | Use |
|---|---|
| `bg-app` | near-black background |
| `bg-card` | elevated widget surface |
| `border-subtle` | hairline card borders |
| `accent` | brand green — live devices, selected chips, primary buttons |
| `accent-2` | purple/violet gradient partner — stats, focus rings |
| `ok / warn / danger` | device status: moving / idle / offline-alert |
| `text-primary / text-muted` | high and reduced contrast text |

Backgrounds must pass WCAG AA on `text-muted`. Data-dense areas use tabular numerals.

## Typography

- Modern sans (Inter) for UI; tabular-nums for values; uppercase micro-labels for widget titles with letter-spacing.

## Application in this repo

- Console layout (T-008/T-053): icon rail + top bar (view switcher, time chips, search) + widget grid.
- Live map (T-008): map fills the main area, device drawer opens right, filter bar under top bar.
- Design tokens (T-054): the palette table above becomes `packages/ui` Tailwind v4 tokens; dark-first, light secondary.
- Embed (T-045): same map treatment, minimal chrome; no rail, no app top bar.
