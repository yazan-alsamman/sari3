import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminLiveService } from './admin-live.service';

@ApiTags('admin-live')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('admin/live')
export class AdminLiveController {
  constructor(private readonly live: AdminLiveService) {}

  @Get()
  @ApiOperation({ summary: 'Live drivers, active orders, and open offers' })
  snapshot() {
    return this.live.snapshot();
  }
}
