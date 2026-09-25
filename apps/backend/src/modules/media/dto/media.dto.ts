import { IsEnum, IsInt, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MediaPurpose } from '@prisma/client';

export class PresignMediaDto {
  @ApiProperty({ enum: MediaPurpose })
  @IsEnum(MediaPurpose)
  purpose!: MediaPurpose;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  mime!: string;

  @ApiProperty({ example: 120_000 })
  @IsInt()
  @Min(1)
  @Max(5 * 1024 * 1024)
  bytes!: number;
}

export class ConfirmMediaDto {
  @ApiProperty()
  @IsString()
  mediaId!: string;
}
