import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateZoneDto {
  @ApiProperty({ example: 'new_area' })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({ example: 'منطقة جديدة' })
  @IsString()
  @MinLength(2)
  nameAr!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  centroidLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  centroidLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateZoneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  nameAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  centroidLat?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  centroidLng?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
