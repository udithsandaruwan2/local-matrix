# ADR-0009 — Canonical telemetry schema with JSONB sensors

- **Status:** accepted
- **Date:** 2026-10-30
- **Deciders:** Udith Sandaruwan
- **Supersedes:** none

## Context

Devices report different payloads: GPS trackers send position, speed, heading, ignition, and fuel; environmental sensors send temperature, humidity, pressure, or door state; some devices have no location at all. The platform must accept arbitrary sensors without a migration per sensor type, while keeping core location queries fast and typed.

## Decision

Use a canonical telemetry point with a fixed location envelope and a flexible sensor map.

```json
{
  "deviceId": "truck-123",
  "timestamp": "2026-10-30T09:00:00.000Z",
  "location": {
    "lat": 6.9271,
    "lng": 79.8612,
    "altitude": 12.4,
    "accuracy": 5,
    "speed": 42.5,
    "heading": 87
  },
  "sensors": {
    "temperature": 24.5,
    "fuel": 68,
    "door": false,
    "status": "moving"
  },
  "tags": { "driver": "A-12" },
  "source": "http"
}
```

Rules:

- `deviceId` is the workspace-scoped external ID.
- `timestamp` is ISO 8601 UTC; server rejects future >5 min and points older than retention.
- `location` is optional for sensor-only devices; when present, `lat` ∈ [-90, 90] and `lng` ∈ [-180, 180].
- `sensors` is a flat map of `string → number | boolean | string`, max 50 keys, key ≤64 chars, string value ≤256 chars.
- Numeric sensors are chartable; boolean/string sensors are shown as state.
- Units are not stored per point in v1; the device metadata may declare `sensorUnits` for display.
- `tags` is a flat map of string → string, max 20 keys, for driver/asset labels.
- Core fields are columns; `sensors` and `tags` are JSONB with GIN indexes only when a query needs them.

## Alternatives

| Option | Why not chosen |
|---|---|
| Fully normalized sensor table | Flexible but write-heavy and slow for 100 events/s with many sensors |
| One column per known sensor | Every new sensor needs a migration; impossible for arbitrary hardware |
| Store only raw JSON | Loses typed location indexes and spatial queries |
| Separate position and sensor events | Doubles events and complicates correlation; one point is simpler |

## Consequences

**Positive**
- One ingest contract for GPS, environmental, and mixed devices.
- New sensor keys need no migration.
- Core location queries use typed columns and GiST/BRIN indexes.
- Sensor charts can discover numeric keys per device.

**Negative**
- JSONB sensor queries are slower than typed columns; use continuous aggregates for common metrics.
- No schema enforcement on sensor semantics; bad units are possible.
- Large sensor maps increase row size; cap at 50 keys.

**Neutral**
- A future `sensor_definitions` table can add units, ranges, and display metadata without changing the point contract.

## Revisit if

- A small set of sensors dominates queries; promote them to typed columns.
- Sensor maps regularly exceed 50 keys or 2 KB.
- Customers require strict unit validation at ingest.

## References

- `project/06-specs/FEAT-001-ingest-api.md`
- `project/03-architecture.md` data model
