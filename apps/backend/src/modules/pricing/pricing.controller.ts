import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSnapshotDto, PreviewPriceDto } from './dto/pricing.dto';
import { PricingService } from './pricing.service';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Post('preview')
  @ApiOperation({
    summary: 'Preview delivery price using active rule (ADR-006)',
  })
  preview(@Body() dto: PreviewPriceDto) {
    return this.pricing.preview(dto);
  }

  @Post('snapshots')
  @ApiOperation({
    summary:
      'Create immutable price snapshot (confirm). Attach to order in Phase 4.',
  })
  snapshot(@Body() dto: CreateSnapshotDto) {
    return this.pricing.createSnapshot(dto);
  }

  @Get('snapshots/:id')
  @ApiOperation({ summary: 'Fetch an immutable price snapshot' })
  getSnapshot(@Param('id') id: string) {
    return this.pricing.getSnapshot(id);
  }
}
