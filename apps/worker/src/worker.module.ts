import { Module } from "@nestjs/common";
import { QueueRuntime } from "./queue/queue.runtime";

/**
 * Standalone worker module. BullMQ registration (BullModule.forRootAsync and
 * per-queue processors) arrives with the first real job in M3; the module is
 * intentionally dependency-free so a Vercel Daemon can boot without Redis.
 */
@Module({
  providers: [QueueRuntime],
})
export class WorkerModule {}
