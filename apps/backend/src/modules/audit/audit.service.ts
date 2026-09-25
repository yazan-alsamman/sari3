import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    actorUserId?: string | null;
    action: string;
    targetType: string;
    targetId: string;
    before?: unknown;
    after?: unknown;
    reason?: string;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        beforeJson: input.before === undefined ? undefined : (input.before as object),
        afterJson: input.after === undefined ? undefined : (input.after as object),
        reason: input.reason,
      },
    });
  }
}
