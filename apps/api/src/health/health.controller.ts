import { Controller, Get } from "@nestjs/common";
import type { HealthReport } from "./health.service";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  check(): HealthReport {
    return this.health.check();
  }
}
