import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaPurpose, Role } from '@prisma/client';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { rm } from 'fs/promises';
import { join, resolve, sep } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ObjectStorageService } from '../../infrastructure/storage/object-storage.service';
import { AuditService } from '../audit/audit.service';
import {
  DOWNLOAD_TTL_SEC,
  ORPHAN_TTL_MS,
  signMediaDownload,
  verifyMediaDownload,
} from './media-access';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

type Actor = { userId: string; role: Role };

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly root: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly objects: ObjectStorageService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
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
    actorRole?: Role;
  }) {
    if (input.actorRole) {
      this.assertUploadRole(input.actorRole, input.purpose);
    } else if (input.purpose !== MediaPurpose.driver_id) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only driver_id allowed without a session',
      });
    }
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

    const media = await this.prisma.mediaObject.create({
      data: {
        purpose: input.purpose,
        mime: input.mime,
        bytes: input.bytes,
        storageKey: 'pending',
        ownerUserId: input.ownerUserId,
      },
    });

    const storageKey = this.objects.keyFor(input.purpose, media.id);
    await this.prisma.mediaObject.update({
      where: { id: media.id },
      data: { storageKey },
    });

    const uploadUrl = this.objects.isEnabled()
      ? await this.objects.presignPut(storageKey, input.mime)
      : `${this.apiBase()}/media/${media.id}/upload`;

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

    if (this.objects.isEnabled()) {
      await this.objects.put(media.storageKey, body, media.mime);
    } else {
      const abs = this.localFile(media.storageKey);
      const dir = join(abs, '..');
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      await pipeline(Readable.from(body), createWriteStream(abs));
    }

    await this.prisma.mediaObject.update({
      where: { id: mediaId },
      data: { bytes: body.length },
    });

    return { ok: true, mediaId, bytes: body.length };
  }

  async confirm(mediaId: string, actor?: Actor | null) {
    const media = await this.prisma.mediaObject.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Media not found' });
    }
    this.assertCanConfirm(media, actor ?? null);
    const present = this.objects.isEnabled()
      ? await this.objects.exists(media.storageKey)
      : existsSync(this.localFile(media.storageKey));
    if (!present) {
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

  /**
   * Short-lived download URL.
   * driver_id is admin review only and every view is audited.
   * Shop and proof photos: owner or admin. Order-assignee checks wait until orders exist.
   */
  async issueDownload(actor: Actor, mediaId: string) {
    const media = await this.prisma.mediaObject.findUnique({ where: { id: mediaId } });
    if (!media?.confirmedAt) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Media not found' });
    }
    if (media.purpose === MediaPurpose.driver_id) {
      if (actor.role !== Role.admin) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'KYC is admin review only',
        });
      }
      await this.audit.record({
        actorUserId: actor.userId,
        action: 'media.kyc.view',
        targetType: 'media_object',
        targetId: media.id,
      });
    } else if (actor.role !== Role.admin && media.ownerUserId !== actor.userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Not allowed to view this media',
      });
    }

    const signed = await this.objects.presignGet(media.storageKey, DOWNLOAD_TTL_SEC);
    if (signed) {
      return { url: signed, expiresIn: DOWNLOAD_TTL_SEC };
    }

    const exp = Math.floor(Date.now() / 1000) + DOWNLOAD_TTL_SEC;
    const sig = signMediaDownload(
      this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      media.id,
      exp,
    );
    return {
      url: `${this.apiBase()}/media/${media.id}/content?exp=${exp}&sig=${encodeURIComponent(sig)}`,
      expiresIn: DOWNLOAD_TTL_SEC,
    };
  }

  async openLocalContent(mediaId: string, exp: number, sig: string) {
    const secret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    if (!verifyMediaDownload(secret, mediaId, exp, sig)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Download link expired or invalid',
      });
    }
    const media = await this.prisma.mediaObject.findUnique({ where: { id: mediaId } });
    if (!media?.confirmedAt) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Media not found' });
    }
    const file = this.localFile(media.storageKey);
    if (!existsSync(file)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Object missing' });
    }
    return { file, mime: media.mime };
  }

  /**
   * Idempotent sweep: unconfirmed objects older than 24h.
   * A linked driver profile is left in place so the foreign key stays valid.
   * A failed delete keeps the row for the next sweep.
   */
  async cleanupOrphans(now = new Date()): Promise<{ deleted: number; failed: number }> {
    const cutoff = new Date(now.getTime() - ORPHAN_TTL_MS);
    const rows = await this.prisma.mediaObject.findMany({
      where: { confirmedAt: null, createdAt: { lt: cutoff } },
      take: 200,
      select: { id: true, storageKey: true },
    });
    let deleted = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        const linked = await this.prisma.driverProfile.findFirst({
          where: { idPhotoMediaId: row.id },
          select: { id: true },
        });
        if (linked) continue;
        await this.objects.delete(row.storageKey);
        await rm(this.localFile(row.storageKey), { force: true });
        await this.prisma.mediaObject.delete({ where: { id: row.id } });
        deleted += 1;
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : 'error';
        this.logger.warn(`orphan delete failed for ${row.id}: ${message}`);
      }
    }
    return { deleted, failed };
  }

  private assertUploadRole(role: Role, purpose: MediaPurpose) {
    const allowed =
      (purpose === MediaPurpose.driver_id &&
        (role === Role.driver || role === Role.admin)) ||
      (purpose === MediaPurpose.shop_landmark &&
        (role === Role.customer || role === Role.admin)) ||
      (purpose === MediaPurpose.delivery_proof &&
        (role === Role.driver || role === Role.admin));
    if (!allowed) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Purpose not allowed for this role',
      });
    }
  }

  private assertCanConfirm(
    media: { ownerUserId: string | null; purpose: MediaPurpose },
    actor: Actor | null,
  ) {
    if (media.ownerUserId) {
      if (!actor) {
        throw new UnauthorizedException({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }
      if (actor.role !== Role.admin && actor.userId !== media.ownerUserId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Not the media owner',
        });
      }
      return;
    }
    if (media.purpose !== MediaPurpose.driver_id && actor?.role !== Role.admin) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Authentication required',
      });
    }
  }

  private apiBase(): string {
    const prefix = process.env.API_PREFIX ?? 'api/v1';
    const port = process.env.PORT ?? '3001';
    return `http://localhost:${port}/${prefix}`;
  }

  private localFile(storageKey: string): string {
    const root = resolve(this.root);
    const abs = resolve(root, storageKey);
    if (abs !== root && !abs.startsWith(root + sep)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid storage key',
      });
    }
    return abs;
  }
}
