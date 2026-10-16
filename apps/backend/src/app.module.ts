import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { MediaModule } from './modules/media/media.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { ZonesModule } from './modules/zones/zones.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { OrdersModule } from './modules/orders/orders.module';
import { IdempotencyModule } from './modules/idempotency/idempotency.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { FinanceModule } from './modules/finance/finance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    RedisModule,
    StorageModule,
    AuditModule,
    HealthModule,
    AuthModule,
    MediaModule,
    AdminModule,
    ZonesModule,
    PricingModule,
    OrdersModule,
    IdempotencyModule,
    RealtimeModule,
    DispatchModule,
    RatingsModule,
    FinanceModule,
  ],
})
export class AppModule {}
