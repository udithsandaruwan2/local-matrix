/**
 * Database access for the whole workspace. Real PrismaClient wiring, the
 * `withWorkspace` tenant helper (ADR-0005), and generated clients land in
 * T-003; this placeholder keeps the workspace compiling and the package
 * importable before the schema exists.
 */
export const DB_PACKAGE = {
  name: "@local-matrix/db",
  version: "0.1.0",
} as const;
