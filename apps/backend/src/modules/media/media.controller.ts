import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
  Put,
  Param,
  Headers,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MediaPurpose } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { ConfirmMediaDto, PresignMediaDto } from './dto/media.dto';
import { MediaService } from './media.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create media slot + upload URL (ADR-015; local adapter until MinIO)',
  })
  presign(@CurrentUser() user: RequestUser, @Body() dto: PresignMediaDto) {
    return this.media.presign({
      purpose: dto.purpose,
      mime: dto.mime,
      bytes: dto.bytes,
      ownerUserId: user.userId,
    });
  }

  @Post('presign-public')
  @ApiOperation({
    summary: 'Public presign for driver_id only (pre-registration KYC)',
  })
  publicPresign(@Body() dto: PresignMediaDto) {
    if (dto.purpose !== MediaPurpose.driver_id) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only driver_id allowed publicly',
      });
    }
    return this.media.presign({
      purpose: dto.purpose,
      mime: dto.mime,
      bytes: dto.bytes,
    });
  }

  @Post('upload-public')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        purpose: { type: 'string', enum: ['driver_id'] },
        file: { type: 'string', format: 'binary' },
      },
      required: ['purpose', 'file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'One-shot public KYC image upload (local adapter; confirms immediately)',
  })
  async uploadPublic(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('purpose') purpose: string,
  ) {
    if (purpose !== 'driver_id') {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only driver_id allowed publicly',
      });
    }
    if (!file) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'file is required',
      });
    }
    const slot = await this.media.presign({
      purpose: MediaPurpose.driver_id,
      mime: file.mimetype,
      bytes: file.size,
    });
    await this.media.saveUpload(slot.mediaId, file.buffer, file.mimetype);
    return this.media.confirm(slot.mediaId);
  }

  @Put(':id/upload')
  @ApiOperation({ summary: 'PUT raw bytes (local stand-in for S3 presigned PUT)' })
  async upload(
    @Param('id') id: string,
    @Req() req: Request & { body?: Buffer },
    @Headers('content-type') contentType?: string,
  ) {
    const body = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(
          typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? ''),
        );
    return this.media.saveUpload(id, body, contentType);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm uploaded media object' })
  confirm(@Body() dto: ConfirmMediaDto) {
    return this.media.confirm(dto.mediaId);
  }
}
