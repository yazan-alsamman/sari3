import { Injectable } from '@nestjs/common';
import { DispatchOfferStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { classifyLocation } from '../dispatch/freshness';

const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.SEARCHING_DRIVER,
  OrderStatus.DRIVER_OFFERED,
  OrderStatus.DRIVER_ACCEPTED,
  OrderStatus.DRIVER_TO_PICKUP,
  OrderStatus.PICKED_UP,
  OrderStatus.IN_TRANSIT,
  OrderStatus.DELIVERED,
];

@Injectable()
export class AdminLiveService {
  constructor(private readonly prisma: PrismaService) {}

  async snapshot() {
    const now = new Date();
    const [orders, offers, availability] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: { in: ACTIVE_STATUSES } },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          mode: true,
          weightClass: true,
          assignedDriverUserId: true,
          updatedAt: true,
        },
      }),
      this.prisma.dispatchOffer.findMany({
        where: { status: DispatchOfferStatus.offered, expiresAt: { gt: now } },
        orderBy: { expiresAt: 'asc' },
        take: 100,
        select: { id: true, orderId: true, driverUserId: true, expiresAt: true },
      }),
      this.prisma.driverAvailability.findMany({
        select: { userId: true, online: true },
      }),
    ]);
    const online = new Map(availability.map((row) => [row.userId, row.online]));
    const profiles = await this.prisma.driverProfile.findMany({
      where: { approvalStatus: 'approved' },
      take: 200,
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        basketSize: true,
        user: { select: { phone: true } },
      },
    });
    const drivers = await Promise.all(
      profiles.map(async (profile) => {
        const sample = await this.prisma.driverLocationSample.findFirst({
          where: { driverUserId: profile.userId },
          orderBy: { receivedAt: 'desc' },
        });
        const freshness = sample
          ? classifyLocation({
              capturedAt: sample.capturedAt,
              receivedAt: now,
              accuracyMeters: sample.accuracyMeters,
            })
          : 'unknown';
        return {
          driverProfileId: profile.id,
          userId: profile.userId,
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          phone: profile.user.phone,
          basketSize: profile.basketSize,
          online: online.get(profile.userId) ?? false,
          freshness,
          point: sample
            ? {
                latitude: sample.latitude,
                longitude: sample.longitude,
                accuracyMeters: sample.accuracyMeters,
                capturedAt: sample.capturedAt.toISOString(),
              }
            : null,
        };
      }),
    );
    return {
      generatedAt: now.toISOString(),
      drivers,
      orders: orders.map((row) => ({
        ...row,
        updatedAt: row.updatedAt.toISOString(),
      })),
      offers: offers.map((row) => ({
        id: row.id,
        orderId: row.orderId,
        driverUserId: row.driverUserId,
        expiresAt: row.expiresAt.toISOString(),
      })),
    };
  }
}
