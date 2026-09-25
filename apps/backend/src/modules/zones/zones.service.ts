import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateZoneDto, UpdateZoneDto } from './dto/zone.dto';

@Injectable()
export class ZonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listActive() {
    return this.prisma.serviceZone.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        nameAr: true,
        centroidLat: true,
        centroidLng: true,
        sortOrder: true,
      },
    });
  }

  listAllAdmin() {
    return this.prisma.serviceZone.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(actorUserId: string, dto: CreateZoneDto) {
    try {
      const created = await this.prisma.serviceZone.create({
        data: {
          code: dto.code.trim(),
          nameAr: dto.nameAr.trim(),
          active: dto.active ?? true,
          centroidLat: dto.centroidLat,
          centroidLng: dto.centroidLng,
          sortOrder: dto.sortOrder ?? 100,
        },
      });
      await this.audit.record({
        actorUserId,
        action: 'zone.create',
        targetType: 'service_zone',
        targetId: created.id,
        after: created,
      });
      return created;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Zone code or name already exists',
        });
      }
      throw e;
    }
  }

  async update(actorUserId: string, id: string, dto: UpdateZoneDto) {
    const before = await this.prisma.serviceZone.findUnique({ where: { id } });
    if (!before) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Zone not found' });
    }
    if (
      dto.active === false &&
      before.active &&
      (await this.prisma.serviceZone.count({ where: { active: true } })) <= 1
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Cannot deactivate the last active zone',
      });
    }
    try {
      const updated = await this.prisma.serviceZone.update({
        where: { id },
        data: {
          nameAr: dto.nameAr?.trim(),
          active: dto.active,
          centroidLat: dto.centroidLat,
          centroidLng: dto.centroidLng,
          sortOrder: dto.sortOrder,
        },
      });
      await this.audit.record({
        actorUserId,
        action: 'zone.update',
        targetType: 'service_zone',
        targetId: id,
        before,
        after: updated,
      });
      return updated;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Zone name already exists',
        });
      }
      throw e;
    }
  }

  async requireActiveById(id: string) {
    const zone = await this.prisma.serviceZone.findUnique({ where: { id } });
    if (!zone || !zone.active) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Unknown or inactive service zone (ADR-005 rejects unknown areas)',
      });
    }
    return zone;
  }
}
