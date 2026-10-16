import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import {
  DispatchOffersController,
  DriverDispatchController,
  OrderTrackingController,
} from './dispatch.controller';
import { DispatchService } from './dispatch.service';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [DriverDispatchController, DispatchOffersController, OrderTrackingController],
  providers: [DispatchService],
})
export class DispatchModule {}
