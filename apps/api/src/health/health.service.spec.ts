import { describe, expect, it } from "vitest";
import { HealthService } from "./health.service";

describe("HealthService", () => {
  it("reports ok status with a measured uptime", () => {
    const report = new HealthService().check();

    expect(report.status).toBe("ok");
    expect(report.version).toBe("0.1.0");
    expect(report.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
