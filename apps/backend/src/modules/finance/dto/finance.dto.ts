import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength, NotEquals } from 'class-validator';

export class TripBonusDto {
  @ApiProperty({ minimum: 0, description: 'Flat SYP added to the driver earning on each completed trip' })
  @IsInt()
  @Min(0)
  amount!: number;
}

export class PostAdjustmentDto {
  @ApiProperty({ enum: ['penalty', 'adjustment'] })
  @IsIn(['penalty', 'adjustment'])
  kind!: 'penalty' | 'adjustment';

  @ApiProperty({ description: 'Penalty is a positive amount. Adjustment is a non-zero signed amount.' })
  @IsInt()
  @NotEquals(0)
  amount!: number;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;
}
