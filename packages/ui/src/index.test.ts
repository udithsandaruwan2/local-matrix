import { describe, expect, it } from "vitest";
import { TOKEN_NAMES } from "./index";

describe("token names", () => {
  it("keeps names unique", () => {
    expect(new Set(TOKEN_NAMES).size).toBe(TOKEN_NAMES.length);
  });

  it("includes the status colors the map needs", () => {
    for (const token of ["ok", "warn", "danger"] as const) {
      expect(TOKEN_NAMES).toContain(token);
    }
  });
});
