import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, Max, Min } from 'class-validator';

export class AvailabilityDto {
  @ApiProperty()
  @IsBoolean()
  online!: boolean;
}

export class LocationSampleDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiProperty({ description: 'Reported GPS accuracy in meters' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10000)
  accuracyMeters!: number;

  @ApiProperty()
  @IsDateString()
  capturedAt!: string;
}
