/**
 * Map primitives shared by the console live map (T-008) and the embed runtime
 * (T-044). Real MapLibre components arrive with those tasks; these constants
 * are the contract they must obey.
 */

/** MapLibre camera state; (lng, lat) pair order matches the GL style spec. */
export interface CenterZoom {
  lng: number;
  lat: number;
  zoom: number;
}

/** Default dark-style view used by everything that mounts a map. */
export const DEFAULT_MAP_VIEW: CenterZoom = {
  lng: 0,
  lat: 0,
  zoom: 2,
};

/** Tile URL is injected at runtime; no map provider token lives in code. */
export const MAP_STYLE_URL_ENV = "VITE_MAP_STYLE_URL";
