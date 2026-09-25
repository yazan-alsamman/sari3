import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminZonesController } from './admin-zones.controller';
import { ZonesController } from './zones.controller';
import { ZonesSeedService } from './zones-seed.service';
import { ZonesService } from './zones.service';

@Module({
  imports: [AuthModule],
  controllers: [ZonesController, AdminZonesController],
  providers: [ZonesService, ZonesSeedService],
  exports: [ZonesService],
})
export class ZonesModule {}
