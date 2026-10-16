import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const SWEEP_MS = 60 * 60 * 1000;

@Injectable()
export class IdempotencyCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IdempotencyCleanupService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.run();
    }, SWEEP_MS);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async run() {
    try {
      const result = await this.prisma.idempotencyRecord.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      if (result.count > 0) {
        this.logger.log(`idempotency cleanup deleted=${result.count}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'error';
      this.logger.error(`idempotency cleanup failed (${message})`);
    }
  }
}
