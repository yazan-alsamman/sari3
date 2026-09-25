import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryMode, WeightClass } from '@prisma/client';

export class PreviewPriceDto {
  @ApiProperty()
  @IsString()
  pickupZoneId!: string;

  @ApiProperty()
  @IsString()
  deliveryZoneId!: string;

  @ApiProperty({ enum: DeliveryMode, default: DeliveryMode.standard })
  @IsEnum(DeliveryMode)
  mode!: DeliveryMode;

  @ApiPropertyOptional({ enum: WeightClass, default: WeightClass.light })
  @IsOptional()
  @IsEnum(WeightClass)
  weightClass?: WeightClass;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  intermediateStopCount?: number;
}

export class CreateSnapshotDto extends PreviewPriceDto {}

export class PricingConfigDto {
  @ApiProperty({ description: 'Map of zone Arabic name → base amount' })
  @IsObject()
  zoneBases!: Record<string, number>;

  @ApiProperty({ example: 1.15 })
  @IsNumber()
  @Min(1)
  crossZoneMultiplier!: number;

  @ApiProperty({ example: 0.4 })
  @IsNumber()
  @Min(0)
  vipSurchargeRate!: number;

  @ApiProperty({ example: 5000 })
  @IsInt()
  @Min(0)
  perStop!: number;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  heavySurcharge!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  routeOverrides?: Record<string, number>;
}

export class PublishPricingRuleDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => PricingConfigDto)
  config!: PricingConfigDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
