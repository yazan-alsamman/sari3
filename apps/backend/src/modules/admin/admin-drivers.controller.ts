import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminDriversService } from './admin-drivers.service';
import { ApproveDriverDto, RejectDriverDto } from './dto/driver-admin.dto';

@ApiTags('admin-drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('admin/drivers')
export class AdminDriversController {
  constructor(private readonly drivers: AdminDriversService) {}

  @Get('pending')
  @ApiOperation({ summary: 'List drivers awaiting KYC approval' })
  pending() {
    return this.drivers.listPending();
  }

  @Post(':driverProfileId/approve')
  @ApiOperation({ summary: 'Approve driver (ADR-003)' })
  approve(
    @CurrentUser() user: RequestUser,
    @Param('driverProfileId') driverProfileId: string,
    @Body() dto: ApproveDriverDto,
  ) {
    return this.drivers.approve(user.userId, driverProfileId, dto.reason);
  }

  @Post(':driverProfileId/reject')
  @ApiOperation({ summary: 'Reject driver KYC' })
  reject(
    @CurrentUser() user: RequestUser,
    @Param('driverProfileId') driverProfileId: string,
    @Body() dto: RejectDriverDto,
  ) {
    return this.drivers.reject(user.userId, driverProfileId, dto.reason);
  }
}
