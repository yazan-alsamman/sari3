import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminDriversController } from './admin-drivers.controller';
import { AdminDriversService } from './admin-drivers.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminDriversController],
  providers: [AdminDriversService],
})
export class AdminModule {}
