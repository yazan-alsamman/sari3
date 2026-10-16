import { Module } from '@nestjs/common';
import { IdempotencyCleanupService } from './idempotency-cleanup.service';

@Module({
  providers: [IdempotencyCleanupService],
})
export class IdempotencyModule {}
