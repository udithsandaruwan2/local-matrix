import { Module } from "@nestjs/common";
import { HealthController } from "./health/health.controller";
import { HealthService } from "./health/health.service";

/** Skeleton module; T-004 adds config, errors, OpenAPI, CORS, rate limiting. */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
