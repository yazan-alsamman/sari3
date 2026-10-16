import { Body, Controller, Get, Headers, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { DriverApprovedGuard } from '../auth/guards/driver-approved.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PostAdjustmentDto, TripBonusDto } from './dto/finance.dto';
import { FinanceService } from './finance.service';

@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, DriverApprovedGuard)
@Controller('drivers/me')
export class DriverFinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('ledger')
  @Roles(Role.driver)
  ledger(@CurrentUser() user: RequestUser) {
    return this.finance.listMine({ userId: user.userId, role: user.role });
  }

  @Get('earnings')
  @Roles(Role.driver)
  earnings(@CurrentUser() user: RequestUser) {
    return this.finance.earnings({ userId: user.userId, role: user.role });
  }
}

@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('admin')
export class AdminFinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('drivers/:driverProfileId/ledger')
  ledger(@Param('driverProfileId') driverProfileId: string) {
    return this.finance.listForDriver(driverProfileId);
  }

  @Patch('drivers/:driverProfileId/trip-bonus')
  tripBonus(
    @CurrentUser() user: RequestUser,
    @Param('driverProfileId') driverProfileId: string,
    @Body() dto: TripBonusDto,
  ) {
    return this.finance.setTripBonus({ userId: user.userId, role: user.role }, driverProfileId, dto);
  }

  @Post('drivers/:driverProfileId/adjustment')
  @HttpCode(200)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  adjust(
    @CurrentUser() user: RequestUser,
    @Param('driverProfileId') driverProfileId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() req: Request,
    @Body() dto: PostAdjustmentDto,
  ) {
    const path = (req.originalUrl ?? req.url).split('?')[0];
    return this.finance.adjust(
      { userId: user.userId, role: user.role },
      driverProfileId,
      idempotencyKey,
      path,
      dto,
    );
  }

  @Get('finance/reports/daily')
  daily() {
    return this.finance.report('day');
  }

  @Get('finance/reports/weekly')
  weekly() {
    return this.finance.report('week');
  }

  @Get('finance/reports/monthly')
  monthly() {
    return this.finance.report('month');
  }

  @Get('finance/reports/yearly')
  yearly() {
    return this.finance.report('year');
  }
}
