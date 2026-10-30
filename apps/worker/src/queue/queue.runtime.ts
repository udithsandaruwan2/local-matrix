import { Injectable } from "@nestjs/common";
import { isQueueEnabled, type WorkerEnv } from "./queue.config";

/**
 * Exhausts BullMQ queue registration behind a runtime switch (no REDIS_URL →
 * no consumer) instead of failing CI on missing infrastructure.
 */
@Injectable()
export class QueueRuntime {
  readonly queueEnabled: boolean;

  constructor(env: WorkerEnv = process.env) {
    this.queueEnabled = isQueueEnabled(env);
  }
}
