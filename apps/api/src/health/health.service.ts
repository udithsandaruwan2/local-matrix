import { Injectable } from "@nestjs/common";

export interface HealthReport {
  status: "ok";
  version: string;
  /** Seconds since process start; proves the event loop is responsive. */
  uptimeSeconds: number;
}

@Injectable()
export class HealthService {
  check(): HealthReport {
    return {
      status: "ok",
      version: "0.1.0",
      uptimeSeconds: Number(process.uptime().toFixed(3)),
    };
  }
}
