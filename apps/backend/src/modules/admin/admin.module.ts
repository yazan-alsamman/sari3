import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AdminDriversController } from './admin-drivers.controller';
import { AdminDriversService } from './admin-drivers.service';
import { AdminLiveController } from './admin-live.controller';
import { AdminLiveService } from './admin-live.service';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [AdminDriversController, AdminLiveController],
  providers: [AdminDriversService, AdminLiveService],
})
export class AdminModule {}
