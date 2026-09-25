-- Phase 3: service zones, pricing rule versions, price snapshots (ADR-005 / ADR-006)

CREATE TYPE "DeliveryMode" AS ENUM ('standard', 'vip');
CREATE TYPE "WeightClass" AS ENUM ('light', 'heavy');

CREATE TABLE "service_zones" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "centroidLat" DOUBLE PRECISION,
    "centroidLng" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "service_zones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "service_zones_code_key" ON "service_zones"("code");
CREATE UNIQUE INDEX "service_zones_nameAr_key" ON "service_zones"("nameAr");
CREATE INDEX "service_zones_active_sortOrder_idx" ON "service_zones"("active", "sortOrder");

CREATE TABLE "pricing_rule_versions" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "currencyCode" TEXT NOT NULL,
    "currencyLabel" TEXT NOT NULL,
    "configJson" JSONB NOT NULL,
    "createdByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pricing_rule_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pricing_rule_versions_version_key" ON "pricing_rule_versions"("version");
CREATE INDEX "pricing_rule_versions_active_idx" ON "pricing_rule_versions"("active");

CREATE TABLE "price_snapshots" (
    "id" TEXT NOT NULL,
    "pricingRuleVersionId" TEXT NOT NULL,
    "pickupZoneId" TEXT NOT NULL,
    "deliveryZoneId" TEXT NOT NULL,
    "pickupZoneName" TEXT NOT NULL,
    "deliveryZoneName" TEXT NOT NULL,
    "mode" "DeliveryMode" NOT NULL,
    "weightClass" "WeightClass" NOT NULL DEFAULT 'light',
    "intermediateStopCount" INTEGER NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL,
    "currencyLabel" TEXT NOT NULL,
    "baseAmount" INTEGER NOT NULL,
    "modeSurcharge" INTEGER NOT NULL,
    "stopsSurcharge" INTEGER NOT NULL,
    "heavySurcharge" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "componentsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "price_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_snapshots_createdAt_idx" ON "price_snapshots"("createdAt");

ALTER TABLE "pricing_rule_versions" ADD CONSTRAINT "pricing_rule_versions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_pricingRuleVersionId_fkey" FOREIGN KEY ("pricingRuleVersionId") REFERENCES "pricing_rule_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
