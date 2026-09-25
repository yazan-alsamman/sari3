import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZonesService } from './zones.service';

@ApiTags('service-zones')
@Controller('service-zones')
export class ZonesController {
  constructor(private readonly zones: ZonesService) {}

  @Get()
  @ApiOperation({ summary: 'List active service zones (ADR-005)' })
  list() {
    return this.zones.listActive();
  }
}
