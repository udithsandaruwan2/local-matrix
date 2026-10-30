/**
 * Pure domain functions. No database, no runtime services; everything here
 * must be unit-testable without mocks (see ADR-0001 dependency rule).
 */

/** WGS-84 coordinate in decimal degrees. */
export interface Point {
  lat: number;
  lng: number;
}

/** Lat/lng range valid for the canonical telemetry envelope (ADR-0009). */
export const LAT_RANGE = { min: -90, max: 90 } as const;
export const LNG_RANGE = { min: -180, max: 180 } as const;

export const isPointInRange = ({ lat, lng }: Point): boolean =>
  lat >= LAT_RANGE.min &&
  lat <= LAT_RANGE.max &&
  lng >= LNG_RANGE.min &&
  lng <= LNG_RANGE.max;
