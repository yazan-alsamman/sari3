import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DriverApprovalStatus, Prisma, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  ACCESS_TOKEN_TTL_SEC,
  MAX_SESSIONS_PER_USER,
  REFRESH_TOKEN_TTL_SEC,
  assertPasswordPolicy,
  normalizePhone,
} from './auth.constants';
import { LoginDto, RegisterDto } from './dto/auth.dto';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
};

export type AuthUserView = {
  id: string;
  phone: string;
  role: Role;
  phoneVerified: boolean;
  driverApprovalStatus?: DriverApprovalStatus;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  private hashRefresh(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private async issueTokens(
    user: { id: string; role: Role },
    deviceLabel?: string,
  ): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: ACCESS_TOKEN_TTL_SEC,
      },
    );

    const refreshToken = randomBytes(48).toString('base64url');
    const familyId = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SEC * 1000);

    const activeCount = await this.prisma.refreshSession.count({
      where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (activeCount >= MAX_SESSIONS_PER_USER) {
      const oldest = await this.prisma.refreshSession.findMany({
        where: { userId: user.id, revokedAt: null },
        orderBy: { createdAt: 'asc' },
        take: activeCount - MAX_SESSIONS_PER_USER + 1,
      });
      await this.prisma.refreshSession.updateMany({
        where: { id: { in: oldest.map((s) => s.id) } },
        data: { revokedAt: new Date() },
      });
    }

    await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefresh(refreshToken),
        familyId,
        deviceLabel,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL_SEC,
      tokenType: 'Bearer',
    };
  }

  private async toUserView(userId: string): Promise<AuthUserView> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { driverProfile: true },
    });
    return {
      id: user.id,
      phone: user.phone,
      role: user.role,
      phoneVerified: user.phoneVerified,
      driverApprovalStatus: user.driverProfile?.approvalStatus,
    };
  }

  async register(dto: RegisterDto): Promise<{ user: AuthUserView; tokens: AuthTokens }> {
    try {
      assertPasswordPolicy(dto.password);
    } catch (e) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: e instanceof Error ? e.message : 'Invalid password',
      });
    }

    const phone = normalizePhone(dto.phone);
    if (phone.length < 8) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid phone',
      });
    }

    if (dto.role === Role.admin) {
      const secret = this.config.get<string>('BOOTSTRAP_ADMIN_SECRET') ?? '';
      if (!secret || dto.bootstrapSecret !== secret) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Admin registration requires valid bootstrap secret',
        });
      }
      const existingAdmin = await this.prisma.user.count({ where: { role: Role.admin } });
      if (existingAdmin > 0) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Admin bootstrap already used',
        });
      }
    }

    if (dto.role === Role.customer && !dto.displayName?.trim()) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'displayName is required for customers',
      });
    }

    if (dto.role === Role.driver) {
      const missing =
        !dto.firstName ||
        !dto.lastName ||
        !dto.birthDate ||
        !dto.vehicleDescription ||
        !dto.basketSize ||
        !dto.idPhotoMediaId;
      if (missing) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message:
            'Driver registration requires firstName, lastName, birthDate, vehicleDescription, basketSize, idPhotoMediaId',
        });
      }
      const media = await this.prisma.mediaObject.findUnique({
        where: { id: dto.idPhotoMediaId },
      });
      if (!media || !media.confirmedAt || media.purpose !== 'driver_id') {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'idPhotoMediaId must reference a confirmed driver_id media object',
        });
      }
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            phone,
            passwordHash,
            role: dto.role,
            phoneVerified: false,
          },
        });

        if (dto.role === Role.customer) {
          await tx.customerProfile.create({
            data: {
              userId: created.id,
              displayName: dto.displayName!.trim(),
            },
          });
        }

        if (dto.role === Role.driver) {
          await tx.driverProfile.create({
            data: {
              userId: created.id,
              firstName: dto.firstName!,
              lastName: dto.lastName!,
              birthDate: new Date(dto.birthDate!),
              vehicleDescription: dto.vehicleDescription!,
              basketSize: dto.basketSize!,
              approvalStatus: DriverApprovalStatus.pending,
              idPhotoMediaId: dto.idPhotoMediaId!,
            },
          });
          await tx.mediaObject.update({
            where: { id: dto.idPhotoMediaId! },
            data: { ownerUserId: created.id },
          });
        }

        return created;
      });

      const tokens = await this.issueTokens(user, dto.deviceLabel);
      const view = await this.toUserView(user.id);
      await this.audit.record({
        actorUserId: user.id,
        action: 'auth.register',
        targetType: 'user',
        targetId: user.id,
        after: { role: user.role, phone: user.phone },
      });
      return { user: view, tokens };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Phone already registered',
        });
      }
      throw e;
    }
  }

  async login(dto: LoginDto): Promise<{ user: AuthUserView; tokens: AuthTokens }> {
    const phone = normalizePhone(dto.phone);
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHORIZED',
        message: 'Invalid credentials',
      });
    }
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHORIZED',
        message: 'Invalid credentials',
      });
    }
    const tokens = await this.issueTokens(user, dto.deviceLabel);
    const view = await this.toUserView(user.id);
    return { user: view, tokens };
  }

  async refresh(rawRefresh: string): Promise<AuthTokens> {
    const tokenHash = this.hashRefresh(rawRefresh);
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
    }

    // Rotation + reuse detection: if already replaced, revoke family
    if (session.replacedById) {
      await this.prisma.refreshSession.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHORIZED',
        message: 'Refresh token reuse detected',
      });
    }

    const newRaw = randomBytes(48).toString('base64url');
    const newHash = this.hashRefresh(newRaw);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SEC * 1000);

    const created = await this.prisma.$transaction(async (tx) => {
      const next = await tx.refreshSession.create({
        data: {
          userId: session.userId,
          tokenHash: newHash,
          familyId: session.familyId,
          deviceLabel: session.deviceLabel,
          expiresAt,
        },
      });
      await tx.refreshSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date(), replacedById: next.id },
      });
      return next;
    });

    const accessToken = await this.jwt.signAsync(
      { sub: session.user.id, role: session.user.role },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: ACCESS_TOKEN_TTL_SEC,
      },
    );

    void created;
    return {
      accessToken,
      refreshToken: newRaw,
      expiresIn: ACCESS_TOKEN_TTL_SEC,
      tokenType: 'Bearer',
    };
  }

  async logout(userId: string, rawRefresh?: string): Promise<void> {
    if (rawRefresh) {
      const tokenHash = this.hashRefresh(rawRefresh);
      await this.prisma.refreshSession.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return;
    }
    await this.prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<AuthUserView> {
    return this.toUserView(userId);
  }
}
