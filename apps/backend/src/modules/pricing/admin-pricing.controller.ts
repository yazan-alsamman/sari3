import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PublishPricingRuleDto } from './dto/pricing.dto';
import { PricingService } from './pricing.service';

@ApiTags('admin-pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('admin/pricing-rules')
export class AdminPricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get()
  @ApiOperation({ summary: 'List pricing rule versions' })
  list() {
    return this.pricing.listRulesAdmin();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active pricing rule' })
  active() {
    return this.pricing.getActiveRule();
  }

  @Post()
  @ApiOperation({
    summary: 'Publish a new pricing rule version (deactivates previous)',
  })
  publish(@CurrentUser() user: RequestUser, @Body() dto: PublishPricingRuleDto) {
    return this.pricing.publishRule(user.userId, dto);
  }
}
