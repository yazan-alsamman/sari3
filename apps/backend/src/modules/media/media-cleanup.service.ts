import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MediaService } from './media.service';

/** Hourly sweep. A failed run leaves rows for the next tick (no separate dead-letter table). */
const SWEEP_MS = 60 * 60 * 1000;

@Injectable()
export class MediaCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MediaCleanupService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly media: MediaService) {}

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
      const result = await this.media.cleanupOrphans();
      if (result.deleted > 0 || result.failed > 0) {
        this.logger.log(
          `orphan media cleanup deleted=${result.deleted} failed=${result.failed}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'error';
      this.logger.error(`orphan media cleanup failed (${message})`);
    }
  }
}
