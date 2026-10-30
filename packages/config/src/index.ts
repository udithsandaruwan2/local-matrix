/** Package identity for the shared tooling/config package. */
export const CONFIG_PACKAGE = {
  name: "@local-matrix/config",
  version: "0.1.0",
} as const;

/** Standard build artifacts, indexed by location inside a workspace package. */
export const BUILD_OUTPUTS = {
  typescript: "dist",
  vite: "dist",
  turboCache: ".turbo",
} as const;
