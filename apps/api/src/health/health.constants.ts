/**
 * Single place for the skeleton's runtime constants. T-004 replaces these with
 * a validated configuration module.
 */

/** Local API port shared with the console Vite proxy and .env.example. */
export const API_PORT = Number(process.env.PORT ?? 3001);
