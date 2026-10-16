import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateComplaintDto, ReviewComplaintDto, SubmitRatingDto } from './dto/rating.dto';
import { RatingsService } from './ratings.service';

@ApiTags('ratings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @Post('orders/:orderId/rating')
  @Roles(Role.customer)
  submit(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: SubmitRatingDto,
  ) {
    return this.ratings.submit(user, orderId, dto);
  }

  @Get('ratings')
  @Roles(Role.customer, Role.admin)
  list(@CurrentUser() user: RequestUser) {
    return this.ratings.list(user);
  }

  @Get('admin/ratings')
  @Roles(Role.admin)
  adminList(@CurrentUser() user: RequestUser) {
    return this.ratings.list(user);
  }

  @Post('orders/:orderId/complaints')
  @Roles(Role.customer)
  complain(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: CreateComplaintDto,
  ) {
    return this.ratings.createComplaint(user, orderId, dto);
  }

  @Get('complaints/:complaintId')
  @Roles(Role.customer, Role.admin)
  getComplaint(@CurrentUser() user: RequestUser, @Param('complaintId') complaintId: string) {
    return this.ratings.getComplaint(user, complaintId);
  }

  @Patch('admin/complaints/:complaintId')
  @Roles(Role.admin)
  review(
    @CurrentUser() user: RequestUser,
    @Param('complaintId') complaintId: string,
    @Body() dto: ReviewComplaintDto,
  ) {
    return this.ratings.review(user, complaintId, dto);
  }
}
