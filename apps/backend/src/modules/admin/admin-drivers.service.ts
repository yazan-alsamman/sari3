import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriverApprovalStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminDriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listPending() {
    return this.prisma.driverProfile.findMany({
      where: { approvalStatus: DriverApprovalStatus.pending },
      include: {
        user: { select: { id: true, phone: true, createdAt: true } },
        idPhoto: {
          select: { id: true, mime: true, bytes: true, confirmedAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approve(actorUserId: string, driverProfileId: string, reason?: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { id: driverProfileId },
    });
    if (!profile) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Driver not found' });
    }
    if (profile.approvalStatus === DriverApprovalStatus.approved) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Already approved',
      });
    }
    const updated = await this.prisma.driverProfile.update({
      where: { id: driverProfileId },
      data: { approvalStatus: DriverApprovalStatus.approved },
    });
    await this.audit.record({
      actorUserId,
      action: 'driver.approve',
      targetType: 'driver_profile',
      targetId: driverProfileId,
      before: { approvalStatus: profile.approvalStatus },
      after: { approvalStatus: updated.approvalStatus },
      reason,
    });
    return updated;
  }

  async reject(actorUserId: string, driverProfileId: string, reason?: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { id: driverProfileId },
    });
    if (!profile) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Driver not found' });
    }
    const updated = await this.prisma.driverProfile.update({
      where: { id: driverProfileId },
      data: { approvalStatus: DriverApprovalStatus.rejected },
    });
    await this.audit.record({
      actorUserId,
      action: 'driver.reject',
      targetType: 'driver_profile',
      targetId: driverProfileId,
      before: { approvalStatus: profile.approvalStatus },
      after: { approvalStatus: updated.approvalStatus },
      reason,
    });
    return updated;
  }
}
