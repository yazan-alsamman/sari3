import { BasketSize } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveDriverDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  reason?: string;
}

export class RejectDriverDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  reason?: string;
}

export class SuspendDriverDto {
  @ApiProperty({ minLength: 2, maxLength: 500 })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  reason!: string;
}

export class UpdateCapacityDto {
  @ApiPropertyOptional({ enum: BasketSize })
  @IsOptional()
  @IsEnum(BasketSize)
  basketSize?: BasketSize;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  capacityNote?: string;
}
