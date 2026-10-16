import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderStatus, Role } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { DriverApprovedGuard } from '../auth/guards/driver-approved.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CancelOrderDto, CreateOrderDto, DeliverOrderDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, DriverApprovedGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @Roles(Role.customer)
  @HttpCode(201)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Submit an order. Server prices it and lands on SEARCHING_DRIVER.' })
  submit(
    @CurrentUser() user: RequestUser,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() req: Request,
    @Body() dto: CreateOrderDto,
  ) {
    const path = (req.originalUrl ?? req.url).split('?')[0];
    return this.orders.submit(
      { userId: user.userId, role: user.role },
      idempotencyKey,
      path,
      dto,
    );
  }

  @Get()
  @Roles(Role.customer)
  @ApiOperation({ summary: 'List the caller’s orders' })
  list(@CurrentUser() user: RequestUser) {
    return this.orders.listMine({ userId: user.userId, role: user.role });
  }

  @Get(':orderId/status-history')
  @ApiOperation({ summary: 'Append-only transition history' })
  history(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    return this.orders.history({ userId: user.userId, role: user.role }, orderId);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get one order visible to the caller' })
  get(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    return this.orders.getForActor({ userId: user.userId, role: user.role }, orderId);
  }

  @Post(':orderId/cancel')
  @Roles(Role.customer)
  @ApiOperation({ summary: 'Cancel before pickup starts. No fee until a commercial sheet is signed.' })
  cancel(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orders.cancel({ userId: user.userId, role: user.role }, orderId, dto);
  }

  @Post(':orderId/start-to-pickup')
  @Roles(Role.driver)
  @ApiOperation({ summary: 'Assigned driver starts toward pickup' })
  start(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    return this.orders.driverAction(
      { userId: user.userId, role: user.role },
      orderId,
      'start_to_pickup',
    );
  }

  @Post(':orderId/pickup')
  @Roles(Role.driver)
  @ApiOperation({ summary: 'Assigned driver confirms pickup' })
  pickup(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    return this.orders.driverAction(
      { userId: user.userId, role: user.role },
      orderId,
      'confirm_pickup',
    );
  }

  @Post(':orderId/in-transit')
  @Roles(Role.driver)
  @ApiOperation({ summary: 'Assigned driver marks the package in transit' })
  inTransit(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    return this.orders.driverAction(
      { userId: user.userId, role: user.role },
      orderId,
      'mark_in_transit',
    );
  }

  @Post(':orderId/deliver')
  @Roles(Role.driver)
  @ApiOperation({ summary: 'Assigned driver confirms delivery. Proof photo is optional.' })
  deliver(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: DeliverOrderDto,
  ) {
    return this.orders.driverAction(
      { userId: user.userId, role: user.role },
      orderId,
      'confirm_delivery',
      dto,
    );
  }

  @Post(':orderId/complete')
  @Roles(Role.driver)
  @ApiOperation({ summary: 'Assigned driver completes the order after delivery confirmation' })
  complete(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    return this.orders.driverAction({ userId: user.userId, role: user.role }, orderId, 'complete');
  }
}

@ApiTags('admin-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Recent orders, optional status filter' })
  list(@Query('status') status?: OrderStatus, @Query('orderNumber') orderNumber?: string) {
    return this.orders.listAdmin(status, orderNumber);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Admin order detail' })
  get(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    return this.orders.getForActor({ userId: user.userId, role: user.role }, orderId);
  }
}
