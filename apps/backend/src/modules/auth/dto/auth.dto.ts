import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BasketSize, Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: '+963912345678' })
  @IsString()
  phone!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: Role, example: Role.customer })
  @IsEnum(Role)
  role!: Role;

  @ApiPropertyOptional({ description: 'Required for customer' })
  @ValidateIf((o: RegisterDto) => o.role === Role.customer)
  @IsString()
  @MinLength(2)
  displayName?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: RegisterDto) => o.role === Role.driver)
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: RegisterDto) => o.role === Role.driver)
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '1995-01-15' })
  @ValidateIf((o: RegisterDto) => o.role === Role.driver)
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: RegisterDto) => o.role === Role.driver)
  @IsString()
  vehicleDescription?: string;

  @ApiPropertyOptional({ enum: BasketSize })
  @ValidateIf((o: RegisterDto) => o.role === Role.driver)
  @IsEnum(BasketSize)
  basketSize?: BasketSize;

  @ApiPropertyOptional({
    description: 'Confirmed media object id for driver national ID (ADR-015)',
  })
  @ValidateIf((o: RegisterDto) => o.role === Role.driver)
  @IsString()
  idPhotoMediaId?: string;

  @ApiPropertyOptional({ description: 'Optional device label for session' })
  @IsOptional()
  @IsString()
  deviceLabel?: string;

  @ApiPropertyOptional({
    description: 'Required when creating the first admin (matches BOOTSTRAP_ADMIN_SECRET)',
  })
  @IsOptional()
  @IsString()
  bootstrapSecret?: string;
}

export class LoginDto {
  @ApiProperty({ example: '+963912345678' })
  @IsString()
  phone!: string;

  @ApiProperty()
  @IsString()
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceLabel?: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'If omitted, revokes current session only when refresh provided',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
