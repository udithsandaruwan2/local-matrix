import { describe, expect, it } from "vitest";
import { isPointInRange } from "./index";

describe("isPointInRange", () => {
  it("accepts valid-ish coordinates (Colombo)", () => {
    expect(isPointInRange({ lat: 6.9271, lng: 79.8612 })).toBe(true);
  });

  it("accepts boundary values", () => {
    expect(isPointInRange({ lat: 90, lng: 180 })).toBe(true);
    expect(isPointInRange({ lat: -90, lng: -180 })).toBe(true);
  });

  it("rejects out-of-range values", () => {
    expect(isPointInRange({ lat: 91, lng: 0 })).toBe(false);
    expect(isPointInRange({ lat: 0, lng: 181 })).toBe(false);
    expect(isPointInRange({ lat: 0, lng: -181 })).toBe(false);
  });
});
