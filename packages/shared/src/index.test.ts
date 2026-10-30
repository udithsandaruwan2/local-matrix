import { describe, expect, it } from "vitest";
import {
  DEVICE_STALE_MS,
  DEVICE_OFFLINE_MS,
  DEVICE_STATUSES,
  PLANS,
  WORKSPACE_ROLES,
} from "./index";

describe("domain constants", () => {
  it("includes the four device statuses, ordered", () => {
    expect(DEVICE_STATUSES.join(",")).toBe("active,stale,offline,archived");
  });

  it("orders workspace roles from most to least privileged", () => {
    expect(WORKSPACE_ROLES[0]).toBe("owner");
    expect(WORKSPACE_ROLES.at(-1)).toBe("viewer");
  });

  it("lists the three public plans", () => {
    expect(PLANS).toHaveLength(3);
  });

  it("keeps offline stricter than stale", () => {
    expect(DEVICE_OFFLINE_MS).toBeGreaterThan(DEVICE_STALE_MS);
  });
});
