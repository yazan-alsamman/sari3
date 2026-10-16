import type { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';

/** ADR-010: Socket.IO on the API HTTP server, same CORS origins as REST. */
export class RealtimeIoAdapter extends IoAdapter {
  constructor(
    app: INestApplication,
    private readonly origins: string[],
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      path: '/socket.io',
      cors: {
        origin: this.origins.length > 0 ? this.origins : false,
        credentials: true,
      },
    });
  }
}
