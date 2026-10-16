import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MediaPurpose, Role } from '@prisma/client';
import { createReadStream } from 'fs';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { ConfirmMediaDto, PresignMediaDto } from './dto/media.dto';
import { MediaService } from './media.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(
    private readonly media: MediaService,
    private readonly jwt: JwtService,
  ) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create media slot + upload URL (ADR-015; S3 when up, local disk otherwise)',
  })
  presign(@CurrentUser() user: RequestUser, @Body() dto: PresignMediaDto) {
    return this.media.presign({
      purpose: dto.purpose,
      mime: dto.mime,
      bytes: dto.bytes,
      ownerUserId: user.userId,
      actorRole: user.role,
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
  confirm(@Req() req: Request, @Body() dto: ConfirmMediaDto) {
    return this.media.confirm(dto.mediaId, this.actorFrom(req));
  }

  @Get(':id/url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Short-lived download URL (5 min). KYC views are audited.',
  })
  downloadUrl(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.media.issueDownload(
      { userId: user.userId, role: user.role },
      id,
    );
  }

  @Get(':id/content')
  @ApiOperation({ summary: 'Local-adapter download. Requires the signed exp and sig.' })
  async content(
    @Param('id') id: string,
    @Query('exp') exp: string,
    @Query('sig') sig: string,
    @Res() res: Response,
  ) {
    try {
      const opened = await this.media.openLocalContent(id, Number(exp), sig ?? '');
      res.setHeader('Content-Type', opened.mime);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      createReadStream(opened.file).pipe(res);
    } catch (error) {
      if (res.headersSent) return;
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json(error.getResponse());
        return;
      }
      res.status(500).json({ code: 'INTERNAL', message: 'Download failed' });
    }
  }

  private actorFrom(req: Request): { userId: string; role: Role } | null {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    try {
      const payload = this.jwt.verify<{ sub: string; role: Role }>(header.slice(7));
      if (!payload?.sub || !payload.role) return null;
      return { userId: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid access token',
      });
    }
  }
}
