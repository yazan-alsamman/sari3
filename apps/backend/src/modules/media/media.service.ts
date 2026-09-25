import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaPurpose } from '@prisma/client';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class MediaService {
  private readonly root: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.root =
      config.get<string>('MEDIA_LOCAL_ROOT')?.trim() ||
      join(process.cwd(), 'storage', 'media');
    if (!existsSync(this.root)) {
      mkdirSync(this.root, { recursive: true });
    }
  }

  async presign(input: {
    purpose: MediaPurpose;
    mime: string;
    bytes: number;
    ownerUserId?: string;
  }) {
    if (!ALLOWED_MIME.has(input.mime)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Only image/jpeg, image/png, image/webp allowed',
      });
    }
    if (input.bytes > 5 * 1024 * 1024) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Max size is 5MB',
      });
    }

    const id = undefined; // prisma generates cuid
    const media = await this.prisma.mediaObject.create({
      data: {
        purpose: input.purpose,
        mime: input.mime,
        bytes: input.bytes,
        storageKey: `pending`, // set after id known
        ownerUserId: input.ownerUserId,
      },
    });

    const storageKey = `${input.purpose}/${media.id}`;
    await this.prisma.mediaObject.update({
      where: { id: media.id },
      data: { storageKey },
    });

    const prefix = process.env.API_PREFIX ?? 'api/v1';
    const port = process.env.PORT ?? '3001';
    // Local adapter (dev/staging without MinIO): client PUTs to this URL (ADR-015 flow shape).
    const uploadUrl = `http://localhost:${port}/${prefix}/media/${media.id}/upload`;

    void id;
    return {
      mediaId: media.id,
      uploadUrl,
      method: 'PUT' as const,
      headers: { 'Content-Type': input.mime },
      maxBytes: 5 * 1024 * 1024,
    };
  }

  async saveUpload(mediaId: string, body: Buffer, contentType?: string) {
    const media = await this.prisma.mediaObject.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Media not found' });
    }
    if (media.confirmedAt) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Media already confirmed',
      });
    }
    if (contentType && contentType !== media.mime) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Content-Type mismatch',
      });
    }
    if (body.length > 5 * 1024 * 1024) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'File too large',
      });
    }
    if (body.length === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Empty body',
      });
    }

    const abs = join(this.root, media.storageKey);
    const dir = join(abs, '..');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    await pipeline(Readable.from(body), createWriteStream(abs));

    await this.prisma.mediaObject.update({
      where: { id: mediaId },
      data: { bytes: body.length },
    });

    return { ok: true, mediaId, bytes: body.length };
  }

  async confirm(mediaId: string) {
    const media = await this.prisma.mediaObject.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Media not found' });
    }
    const abs = join(this.root, media.storageKey);
    if (!existsSync(abs)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Upload missing; PUT to uploadUrl first',
      });
    }
    return this.prisma.mediaObject.update({
      where: { id: mediaId },
      data: { confirmedAt: new Date() },
      select: {
        id: true,
        purpose: true,
        mime: true,
        bytes: true,
        confirmedAt: true,
      },
    });
  }
}
