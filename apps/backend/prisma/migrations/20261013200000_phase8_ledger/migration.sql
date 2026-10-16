-- ADR-013. Append-only ledger. 75/25 posts when an order reaches COMPLETED.

ALTER TABLE "driver_profiles" ADD COLUMN "tripBonusAmount" INTEGER NOT NULL DEFAULT 0;

CREATE TYPE "LedgerEntryKind" AS ENUM (
  'delivery_driver_earning',
  'delivery_platform_share',
  'driver_bonus',
  'penalty',
  'adjustment',
  'settlement_payout'
);

CREATE TABLE "ledger_entries" (
  "id" TEXT NOT NULL,
  "driverUserId" TEXT,
  "orderId" TEXT,
  "kind" "LedgerEntryKind" NOT NULL,
  "amount" INTEGER NOT NULL,
  "currencyCode" TEXT NOT NULL,
  "reason" TEXT,
  "actorUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ledger_entries_driverUserId_createdAt_idx" ON "ledger_entries"("driverUserId", "createdAt");
CREATE INDEX "ledger_entries_createdAt_idx" ON "ledger_entries"("createdAt");
CREATE INDEX "ledger_entries_orderId_idx" ON "ledger_entries"("orderId");

CREATE UNIQUE INDEX "ledger_entries_delivery_kind_key"
  ON "ledger_entries" ("orderId", "kind")
  WHERE "kind" IN ('delivery_driver_earning', 'delivery_platform_share', 'driver_bonus');

ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_driverUserId_fkey"
  FOREIGN KEY ("driverUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
