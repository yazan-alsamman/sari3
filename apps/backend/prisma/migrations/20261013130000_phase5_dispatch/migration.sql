-- Phase 5: availability, location samples, dispatch offers (ADR-007 / ADR-011)

CREATE TABLE "driver_availability" (
    "userId" TEXT NOT NULL,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_availability_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "driver_location_samples" (
    "id" TEXT NOT NULL,
    "driverUserId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracyMeters" DOUBLE PRECISION NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_location_samples_pkey" PRIMARY KEY ("id")
);

CREATE TYPE "DispatchOfferStatus" AS ENUM ('offered', 'accepted', 'rejected', 'expired', 'cancelled');

CREATE TABLE "dispatch_offers" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "driverUserId" TEXT NOT NULL,
    "status" "DispatchOfferStatus" NOT NULL DEFAULT 'offered',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "dispatch_offers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "driver_location_samples_driverUserId_receivedAt_idx" ON "driver_location_samples"("driverUserId", "receivedAt");
CREATE INDEX "dispatch_offers_driverUserId_status_idx" ON "dispatch_offers"("driverUserId", "status");
CREATE INDEX "dispatch_offers_orderId_status_idx" ON "dispatch_offers"("orderId", "status");
CREATE INDEX "dispatch_offers_status_expiresAt_idx" ON "dispatch_offers"("status", "expiresAt");

ALTER TABLE "driver_availability" ADD CONSTRAINT "driver_availability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_location_samples" ADD CONSTRAINT "driver_location_samples_driverUserId_fkey" FOREIGN KEY ("driverUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispatch_offers" ADD CONSTRAINT "dispatch_offers_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispatch_offers" ADD CONSTRAINT "dispatch_offers_driverUserId_fkey" FOREIGN KEY ("driverUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
