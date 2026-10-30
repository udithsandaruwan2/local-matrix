import { describe, expect, it } from "vitest";
import { isQueueEnabled } from "./queue.config";

describe("isQueueEnabled", () => {
  it("disables the consumer without a Redis URL", () => {
    expect(isQueueEnabled({})).toBe(false);
    expect(isQueueEnabled({ REDIS_URL: "" })).toBe(false);
  });

  it("enables the consumer with any non-empty URL", () => {
    expect(isQueueEnabled({ REDIS_URL: "redis://localhost:6379" })).toBe(true);
  });
});
