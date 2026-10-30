import { describe, expect, it } from "vitest";
import { ROUTES } from "./routes";

describe("route table", () => {
  it("keeps root as home and map under /map", () => {
    expect(ROUTES.home).toBe("/");
    expect(ROUTES.map).toBe("/map");
  });

  it("has no duplicate paths", () => {
    const paths = Object.values(ROUTES);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
