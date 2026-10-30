/** Static contract the embed runtime must satisfy (FEAT-040). */

/** Token arrives from the host web component; never from workspace keys. */
export const EMBED_PARAMS = {
  token: "token",
  embedId: "embedId",
} as const;

/** Minimum iframe height in px; the host sizes it via its own layout. */
export const EMBED_MIN_HEIGHT_PX = 320;

/** postMessage event machine state names for T-045. */
export const EMBED_READY_EVENT = "ready" as const;
export const EMBED_ERROR_EVENT = "error" as const;
