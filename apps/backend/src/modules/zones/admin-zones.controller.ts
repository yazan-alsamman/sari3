import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateZoneDto, UpdateZoneDto } from './dto/zone.dto';
import { ZonesService } from './zones.service';

@ApiTags('admin-zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('admin/service-zones')
export class AdminZonesController {
  constructor(private readonly zones: ZonesService) {}

  @Get()
  @ApiOperation({ summary: 'List all service zones (admin)' })
  list() {
    return this.zones.listAllAdmin();
  }

  @Post()
  @ApiOperation({ summary: 'Create service zone' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateZoneDto) {
    return this.zones.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update / activate / deactivate zone' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.zones.update(user.userId, id, dto);
  }
}
