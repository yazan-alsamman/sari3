import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { DriverApprovedGuard } from '../auth/guards/driver-approved.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DispatchService } from './dispatch.service';
import { AvailabilityDto, LocationSampleDto } from './dto/dispatch.dto';

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, DriverApprovedGuard)
@Controller('drivers/me')
export class DriverDispatchController {
  constructor(private readonly dispatch: DispatchService) {}

  @Post('availability')
  @Roles(Role.driver)
  @HttpCode(200)
  setAvailability(@CurrentUser() user: RequestUser, @Body() dto: AvailabilityDto) {
    return this.dispatch.setAvailability(user, dto);
  }

  @Post('location')
  @Roles(Role.driver)
  @HttpCode(200)
  ingestLocation(@CurrentUser() user: RequestUser, @Body() dto: LocationSampleDto) {
    return this.dispatch.ingestLocation(user, dto);
  }

  @Get('offers')
  @Roles(Role.driver)
  listOffers(@CurrentUser() user: RequestUser) {
    return this.dispatch.listOffers(user);
  }
}

@ApiTags('dispatch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, DriverApprovedGuard)
@Controller('dispatch/offers')
export class DispatchOffersController {
  constructor(private readonly dispatch: DispatchService) {}

  @Post(':offerId/accept')
  @Roles(Role.driver)
  @HttpCode(200)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  accept(
    @CurrentUser() user: RequestUser,
    @Param('offerId') offerId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() req: Request,
  ) {
    return this.dispatch.accept(user, offerId, idempotencyKey, req.originalUrl);
  }

  @Post(':offerId/reject')
  @Roles(Role.driver)
  @HttpCode(200)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  reject(
    @CurrentUser() user: RequestUser,
    @Param('offerId') offerId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() req: Request,
  ) {
    return this.dispatch.reject(user, offerId, idempotencyKey, req.originalUrl);
  }
}

@ApiTags('tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrderTrackingController {
  constructor(private readonly dispatch: DispatchService) {}

  @Get(':orderId/tracking')
  tracking(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    return this.dispatch.tracking(user, orderId);
  }
}
