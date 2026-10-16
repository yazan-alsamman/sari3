import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}
