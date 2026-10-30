import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DB_PACKAGE } from "./index";

describe("db package", () => {
  it("declares the postgres datasource and generated-client output", () => {
    const schema = readFileSync(join(import.meta.dirname, "../prisma/schema.prisma"), "utf8");
    expect(schema).toContain('provider = "postgresql"');
    expect(schema).toContain('output   = "../src/generated"');
  });

  it("exposes the package identity", () => {
    expect(DB_PACKAGE.name).toBe("@local-matrix/db");
  });
});
