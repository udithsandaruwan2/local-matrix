import { describe, expect, it } from "vitest";
import {
  EMBED_ERROR_EVENT,
  EMBED_MIN_HEIGHT_PX,
  EMBED_READY_EVENT,
} from "./embed-contract";

describe("embed contract", () => {
  it("declares ready/error as the first postMessage events", () => {
    expect(EMBED_READY_EVENT).toBe("ready");
    expect(EMBED_ERROR_EVENT).toBe("error");
  });

  it("keeps the iframe a sane minimum height", () => {
    expect(EMBED_MIN_HEIGHT_PX).toBeGreaterThanOrEqual(240);
  });
});
