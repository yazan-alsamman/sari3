import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryMode, WeightClass } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  pickupZoneId!: string;

  @ApiProperty()
  @IsString()
  deliveryZoneId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  pickupShopName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  deliveryShopName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  pickupLandmark!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  deliveryLandmark!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  specialHandlingNotes!: string;

  @ApiProperty({ enum: DeliveryMode })
  @IsEnum(DeliveryMode)
  mode!: DeliveryMode;

  @ApiProperty({ enum: WeightClass })
  @IsEnum(WeightClass)
  weightClass!: WeightClass;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  intermediateStopCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickupLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  pickupLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  deliveryLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  deliveryLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupPhotoMediaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryPhotoMediaId?: string;
}

export class CancelOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class DeliverOrderDto {
  @ApiPropertyOptional({ description: 'Optional confirmed delivery_proof media id' })
  @IsOptional()
  @IsString()
  proofMediaId?: string;
}
