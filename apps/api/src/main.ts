import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { API_PORT } from "./health/health.constants";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  await app.listen(API_PORT);
  const url = await app.getUrl();
  // Structured logging (pino) and request-ID middleware land in T-004.
  console.log(`api listening at ${url}`);
}

void bootstrap();
