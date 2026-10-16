/**
 * Worker entrypoint (ADR-001 Option B).
 * Loads the application context so the orphan-media sweep (ADR-015) runs here
 * as well as in the API process. BullMQ processors for other jobs are still later.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrapWorker() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  // eslint-disable-next-line no-console
  console.log('sareee-worker online — orphan media cleanup scheduled hourly');

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });
}

void bootstrapWorker();
