import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DispatchOfferStatus,
  DriverApprovalStatus,
  OrderStatus,
  TransitionSource,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RealtimePublisher } from '../realtime/realtime.publisher';
import { UpdateCapacityDto } from './dto/driver-admin.dto';

@Injectable()
export class AdminDriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimePublisher,
  ) {}

  list() {
    return this.prisma.driverProfile.findMany({
      include: {
        user: { select: { id: true, phone: true, createdAt: true } },
        idPhoto: { select: { id: true, mime: true, bytes: true, confirmedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

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

  async suspend(actorUserId: string, driverProfileId: string, reason: string) {
    const profile = await this.requireProfile(driverProfileId);
    if (profile.approvalStatus !== DriverApprovalStatus.approved) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Only an approved driver can be suspended',
      });
    }
    const updated = await this.prisma.driverProfile.update({
      where: { id: profile.id },
      data: { approvalStatus: DriverApprovalStatus.suspended },
    });
    await this.prisma.driverAvailability.updateMany({
      where: { userId: profile.userId },
      data: { online: false },
    });
    await this.withdrawOpenOffers(profile.userId, actorUserId);
    await this.audit.record({
      actorUserId,
      action: 'driver.suspend',
      targetType: 'driver_profile',
      targetId: profile.id,
      before: { approvalStatus: profile.approvalStatus },
      after: { approvalStatus: updated.approvalStatus },
      reason: reason.trim(),
    });
    return updated;
  }

  async reactivate(actorUserId: string, driverProfileId: string, reason: string) {
    const profile = await this.requireProfile(driverProfileId);
    if (profile.approvalStatus !== DriverApprovalStatus.suspended) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Only a suspended driver can be reactivated',
      });
    }
    const updated = await this.prisma.driverProfile.update({
      where: { id: profile.id },
      data: { approvalStatus: DriverApprovalStatus.approved },
    });
    await this.audit.record({
      actorUserId,
      action: 'driver.reactivate',
      targetType: 'driver_profile',
      targetId: profile.id,
      before: { approvalStatus: profile.approvalStatus },
      after: { approvalStatus: updated.approvalStatus },
      reason: reason.trim(),
    });
    return updated;
  }

  async updateCapacity(actorUserId: string, driverProfileId: string, dto: UpdateCapacityDto) {
    if (dto.basketSize === undefined && dto.capacityNote === undefined) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Provide basketSize or capacityNote',
      });
    }
    const profile = await this.requireProfile(driverProfileId);
    const updated = await this.prisma.driverProfile.update({
      where: { id: profile.id },
      data: {
        ...(dto.basketSize ? { basketSize: dto.basketSize } : {}),
        ...(dto.capacityNote !== undefined ? { capacityNote: dto.capacityNote.trim() || null } : {}),
      },
    });
    await this.audit.record({
      actorUserId,
      action: 'driver.capacity',
      targetType: 'driver_profile',
      targetId: profile.id,
      before: { basketSize: profile.basketSize, capacityNote: profile.capacityNote },
      after: { basketSize: updated.basketSize, capacityNote: updated.capacityNote },
    });
    return {
      id: updated.id,
      basketSize: updated.basketSize,
      capacityNote: updated.capacityNote,
    };
  }

  private async requireProfile(driverProfileId: string) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { id: driverProfileId } });
    if (!profile) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Driver not found' });
    return profile;
  }

  private async withdrawOpenOffers(driverUserId: string, actorUserId: string) {
    const open = await this.prisma.dispatchOffer.findMany({
      where: { driverUserId, status: DispatchOfferStatus.offered },
      select: { id: true, orderId: true, driverUserId: true },
    });
    if (open.length === 0) return;
    await this.prisma.dispatchOffer.updateMany({
      where: { id: { in: open.map((row) => row.id) } },
      data: { status: DispatchOfferStatus.cancelled, resolvedAt: new Date() },
    });
    for (const row of open) {
      this.realtime.offerEnded(row.driverUserId, {
        offerId: row.id,
        orderId: row.orderId,
        status: 'cancelled',
      });
    }
    for (const orderId of [...new Set(open.map((row) => row.orderId))]) {
      const stillOpen = await this.prisma.dispatchOffer.count({
        where: { orderId, status: DispatchOfferStatus.offered },
      });
      if (stillOpen > 0) continue;
      const changed = await this.prisma.order.updateMany({
        where: { id: orderId, status: OrderStatus.DRIVER_OFFERED, assignedDriverUserId: null },
        data: { status: OrderStatus.SEARCHING_DRIVER },
      });
      if (changed.count !== 1) continue;
      await this.prisma.orderTransition.create({
        data: {
          orderId,
          fromStatus: OrderStatus.DRIVER_OFFERED,
          toStatus: OrderStatus.SEARCHING_DRIVER,
          action: 'driver_suspended',
          source: TransitionSource.admin,
          actorUserId,
        },
      });
      const current = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { customerUserId: true, status: true, assignedDriverUserId: true },
      });
      if (current) {
        this.realtime.orderStatusChanged({
          orderId,
          status: current.status,
          customerUserId: current.customerUserId,
          assignedDriverUserId: current.assignedDriverUserId,
        });
      }
    }
  }
}
