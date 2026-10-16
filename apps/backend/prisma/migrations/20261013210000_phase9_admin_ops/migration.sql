-- ADR-008. Ops note on the driver profile. Not a numeric weight limit.

ALTER TABLE "driver_profiles" ADD COLUMN "capacityNote" TEXT;
