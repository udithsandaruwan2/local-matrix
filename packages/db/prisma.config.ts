import { defineConfig } from "@prisma/config";

/**
 * Prisma 7 config. Connection URLs live here, not in the schema (P1012).
 * DATABASE_URL is used by migrate/introspection commands; the runtime client
 * will receive a driver adapter instead (T-003+). The datasource key is only
 * present when the URL exists, so optional-strict types stay satisfied without
 * a local .env.
 */
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
