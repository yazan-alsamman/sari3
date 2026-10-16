-- Phase 4: orders, transition history, idempotency (ADR-004 / ADR-006 / ADR-017)

CREATE TYPE "OrderStatus" AS ENUM (
  'DRAFT',
  'PRICE_CONFIRMED',
  'SEARCHING_DRIVER',
  'DRIVER_OFFERED',
  'DRIVER_ACCEPTED',
  'DRIVER_TO_PICKUP',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
  'FAILED',
  'UNFULFILLED'
);

CREATE TYPE "TransitionSource" AS ENUM ('customer', 'driver', 'admin', 'system');

CREATE TABLE "orders" (
  "id" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "customerUserId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL,
  "mode" "DeliveryMode" NOT NULL,
  "weightClass" "WeightClass" NOT NULL,
  "specialHandlingNotes" TEXT NOT NULL,
  "intermediateStopCount" INTEGER NOT NULL DEFAULT 0,
  "pickupZoneId" TEXT NOT NULL,
  "deliveryZoneId" TEXT NOT NULL,
  "pickupShopName" TEXT NOT NULL,
  "deliveryShopName" TEXT NOT NULL,
  "pickupLandmark" TEXT NOT NULL,
  "deliveryLandmark" TEXT NOT NULL,
  "pickupLat" DOUBLE PRECISION,
  "pickupLng" DOUBLE PRECISION,
  "deliveryLat" DOUBLE PRECISION,
  "deliveryLng" DOUBLE PRECISION,
  "pickupPhotoMediaId" TEXT,
  "deliveryPhotoMediaId" TEXT,
  "deliveryProofMediaId" TEXT,
  "priceSnapshotId" TEXT NOT NULL,
  "assignedDriverUserId" TEXT,
  "cancelReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
CREATE UNIQUE INDEX "orders_priceSnapshotId_key" ON "orders"("priceSnapshotId");
CREATE INDEX "orders_customerUserId_createdAt_idx" ON "orders"("customerUserId", "createdAt");
CREATE INDEX "orders_status_updatedAt_idx" ON "orders"("status", "updatedAt");
CREATE INDEX "orders_assignedDriverUserId_status_idx" ON "orders"("assignedDriverUserId", "status");

CREATE TABLE "order_transitions" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "fromStatus" "OrderStatus",
  "toStatus" "OrderStatus" NOT NULL,
  "action" TEXT NOT NULL,
  "actorUserId" TEXT,
  "source" "TransitionSource" NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_transitions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_transitions_orderId_createdAt_idx" ON "order_transitions"("orderId", "createdAt");

CREATE TABLE "idempotency_records" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "responseStatus" INTEGER NOT NULL,
  "responseBody" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "idempotency_records_actorUserId_method_path_key_key" ON "idempotency_records"("actorUserId", "method", "path", "key");
CREATE INDEX "idempotency_records_expiresAt_idx" ON "idempotency_records"("expiresAt");

ALTER TABLE "orders" ADD CONSTRAINT "orders_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_assignedDriverUserId_fkey" FOREIGN KEY ("assignedDriverUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickupZoneId_fkey" FOREIGN KEY ("pickupZoneId") REFERENCES "service_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "service_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickupPhotoMediaId_fkey" FOREIGN KEY ("pickupPhotoMediaId") REFERENCES "media_objects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryPhotoMediaId_fkey" FOREIGN KEY ("deliveryPhotoMediaId") REFERENCES "media_objects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryProofMediaId_fkey" FOREIGN KEY ("deliveryProofMediaId") REFERENCES "media_objects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_priceSnapshotId_fkey" FOREIGN KEY ("priceSnapshotId") REFERENCES "price_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_transitions" ADD CONSTRAINT "order_transitions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
