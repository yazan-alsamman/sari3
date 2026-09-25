import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * Blocks driver-role callers who are not approved (ADR-003 / ADR-002 KYC).
 * Non-driver roles pass through.
 */
@Injectable()
export class DriverApprovedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      user?: { userId: string; role: Role };
    }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Unauthenticated' });
    }
    if (user.role !== Role.driver) return true;

    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId: user.userId },
      select: { approvalStatus: true },
    });
    if (!profile || profile.approvalStatus !== 'approved') {
      throw new ForbiddenException({
        code: 'DRIVER_NOT_APPROVED',
        message: 'Driver KYC pending or not approved',
      });
    }
    return true;
  }
}
