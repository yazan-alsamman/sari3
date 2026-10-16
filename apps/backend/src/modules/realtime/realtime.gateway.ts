import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OrderStatus, Role } from '@prisma/client';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { principalFromAccessPayload, readSocketAccessToken, type SocketPrincipal } from './socket-auth';
import { ADMIN_OPS_ROOM, driverRoom, orderRoom } from './realtime-events';

const CUSTOMER_ROOMS: OrderStatus[] = [
  OrderStatus.SEARCHING_DRIVER,
  OrderStatus.DRIVER_OFFERED,
  OrderStatus.DRIVER_ACCEPTED,
  OrderStatus.DRIVER_TO_PICKUP,
  OrderStatus.PICKED_UP,
  OrderStatus.IN_TRANSIT,
  OrderStatus.DELIVERED,
];

const ASSIGNED_ROOMS: OrderStatus[] = [
  OrderStatus.DRIVER_ACCEPTED,
  OrderStatus.DRIVER_TO_PICKUP,
  OrderStatus.PICKED_UP,
  OrderStatus.IN_TRANSIT,
  OrderStatus.DELIVERED,
];

/**
 * ADR-010 transport plus ADR-016 membership.
 * The client cannot choose a room. Join happens here and in RealtimePublisher.
 */
@WebSocketGateway({ path: '/socket.io' })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  handleConnection(client: Socket): void {
    const token = readSocketAccessToken({
      authToken: client.handshake.auth?.token,
      authorizationHeader: client.handshake.headers.authorization,
    });
    if (!token) {
      client.disconnect(true);
      return;
    }
    let principal: SocketPrincipal | null;
    try {
      principal = principalFromAccessPayload(this.jwt.verify(token));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'invalid token';
      this.logger.warn(`Socket auth rejected: ${message}`);
      client.disconnect(true);
      return;
    }
    if (!principal) {
      client.disconnect(true);
      return;
    }
    client.data.principal = principal;
    void this.joinAuthorizedRooms(client, principal);
  }

  joinUser(userId: string, room: string): void {
    if (!this.server) return;
    for (const socket of this.server.sockets.sockets.values()) {
      const principal = socket.data.principal as SocketPrincipal | undefined;
      if (principal?.userId === userId) void socket.join(room);
    }
  }

  emit(room: string, event: string, payload: unknown): void {
    if (!this.server) return;
    this.server.to(room).emit(event, payload);
  }

  private async joinAuthorizedRooms(client: Socket, principal: SocketPrincipal): Promise<void> {
    if (principal.role === Role.admin) {
      await client.join(ADMIN_OPS_ROOM);
      return;
    }
    if (principal.role === Role.driver) {
      await client.join(driverRoom(principal.userId));
      const assigned = await this.prisma.order.findMany({
        where: { assignedDriverUserId: principal.userId, status: { in: ASSIGNED_ROOMS } },
        select: { id: true },
      });
      if (assigned.length > 0) await client.join(assigned.map((row) => orderRoom(row.id)));
      return;
    }
    const own = await this.prisma.order.findMany({
      where: { customerUserId: principal.userId, status: { in: CUSTOMER_ROOMS } },
      select: { id: true },
    });
    if (own.length > 0) await client.join(own.map((row) => orderRoom(row.id)));
  }
}
