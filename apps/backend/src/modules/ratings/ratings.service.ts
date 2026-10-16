import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ComplaintStatus, OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateComplaintDto, ReviewComplaintDto, SubmitRatingDto } from './dto/rating.dto';

type Actor = { userId: string; role: Role };

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async submit(actor: Actor, orderId: string, dto: SubmitRatingDto) {
    const order = await this.owned(actor.userId, orderId);
    if (order.status !== OrderStatus.COMPLETED) {
      throw new ConflictException({
        code: 'RATING_NOT_ELIGIBLE',
        message: 'Rating is available after the order is completed',
      });
    }
    try {
      const row = await this.prisma.rating.create({
        data: {
          orderId: order.id,
          customerUserId: actor.userId,
          driverUserId: order.assignedDriverUserId,
          stars: dto.stars,
          notes: dto.notes?.trim() || null,
        },
      });
      return this.presentRating(row);
    } catch (error) {
      if (this.isUnique(error)) {
        throw new ConflictException({
          code: 'RATING_EXISTS',
          message: 'This order already has a rating',
        });
      }
      throw error;
    }
  }

  async list(actor: Actor) {
    const rows = await this.prisma.rating.findMany({
      where: actor.role === Role.admin ? {} : { customerUserId: actor.userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => this.presentRating(row));
  }

  async createComplaint(actor: Actor, orderId: string, dto: CreateComplaintDto) {
    const order = await this.owned(actor.userId, orderId);
    const row = await this.prisma.complaint.create({
      data: {
        orderId: order.id,
        customerUserId: actor.userId,
        body: dto.body.trim(),
      },
    });
    return this.presentComplaint(row);
  }

  async getComplaint(actor: Actor, complaintId: string) {
    const row = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!row) throw new NotFoundException({ code: 'COMPLAINT_NOT_FOUND', message: 'Complaint not found' });
    if (actor.role !== Role.admin && row.customerUserId !== actor.userId) {
      throw new NotFoundException({ code: 'COMPLAINT_NOT_FOUND', message: 'Complaint not found' });
    }
    return this.presentComplaint(row);
  }

  async review(actor: Actor, complaintId: string, dto: ReviewComplaintDto) {
    if (dto.status !== ComplaintStatus.investigated && dto.status !== ComplaintStatus.dismissed) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Review status must be investigated or dismissed',
      });
    }
    const note = dto.note?.trim() || null;
    if (dto.status === ComplaintStatus.dismissed && !note) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Dismiss requires a reason',
      });
    }
    const row = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!row) throw new NotFoundException({ code: 'COMPLAINT_NOT_FOUND', message: 'Complaint not found' });
    const updated = await this.prisma.complaint.update({
      where: { id: row.id },
      data: { status: dto.status, adminNote: note ?? row.adminNote },
    });
    await this.audit.record({
      actorUserId: actor.userId,
      action: 'complaint.review',
      targetType: 'complaint',
      targetId: row.id,
      before: { status: row.status, adminNote: row.adminNote },
      after: { status: updated.status, adminNote: updated.adminNote },
      reason: note ?? undefined,
    });
    return this.presentComplaint(updated);
  }

  private async owned(customerUserId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.customerUserId !== customerUserId) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    }
    return order;
  }

  private presentRating(row: {
    id: string;
    orderId: string;
    customerUserId: string;
    driverUserId: string | null;
    stars: number;
    notes: string | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      orderId: row.orderId,
      customerUserId: row.customerUserId,
      driverUserId: row.driverUserId,
      stars: row.stars,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private presentComplaint(row: {
    id: string;
    orderId: string;
    customerUserId: string;
    body: string;
    status: ComplaintStatus;
    adminNote: string | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      orderId: row.orderId,
      customerUserId: row.customerUserId,
      body: row.body,
      status: row.status,
      adminNote: row.adminNote,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private isUnique(error: unknown): boolean {
    return error !== null && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002';
  }
}
