-- Phase 1 bootstrap migration: schema_meta only.
-- Auth/orders/dispatch tables are added in later phase migrations.

CREATE TABLE "schema_meta" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schema_meta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "schema_meta_key_key" ON "schema_meta"("key");
