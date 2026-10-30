import { NestFactory } from "@nestjs/core";
import { WorkerModule } from "./worker.module";
import { QueueRuntime } from "./queue/queue.runtime";

/** Vercel Daemon / container entrypoint. No HTTP server; boot, log, hold. */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule);

  const runtime = app.get(QueueRuntime);
  console.log(
    runtime.queueEnabled
      ? "worker started with queue consumer enabled"
      : "worker started without REDIS_URL — queue consumer disabled",
  );

  app.enableShutdownHooks();
}

void bootstrap();
