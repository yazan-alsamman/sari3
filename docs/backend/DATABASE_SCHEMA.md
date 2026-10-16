# Database Schema

## Purpose

Documents the **conceptual** persistence model needed to support documented features.

## Status

Conceptual model only.

**Do not treat this as a physical PostgreSQL/Prisma schema.**

Exact Prisma definitions and migrations must be finalized only after domain model and relevant ADRs are frozen.

## Conceptual vs physical

| Layer | This document | Deferred |
|---|---|---|
| Conceptual entities & relationships | Yes | — |
| Cardinality & uniqueness intent | Yes | — |
| Important index intent | Yes (logical) | — |
| Physical PostgreSQL types | No | After ADR freeze |
| Prisma schema / migrations | No | Implementation phases |

## Identity

| Concept | Notes |
|---|---|
| users | Auth identity |
| customer_profiles | 1:1 or 1:N with users — **TBD** |
| driver_profiles | 1:1 or 1:N with users — **TBD** |
| admin_users **or** role on users | Model ambiguity — **TBD — ADR-002 / ADR-003** |
| refresh_token_families / device_sessions | Session/revocation support |

## Operations

| Concept | Notes |
|---|---|
| service_zones | Geometry/rules TBD ADR-005 |
| zone_prices | Versioned pricing TBD ADR-006 |
| driver_capacity_profiles | Limits TBD ADR-008 |
| driver_service_zone_assignments | Many-to-many intent |
| driver_availability | Current operational state |

## Orders

| Concept | Notes |
|---|---|
| orders | Aggregate root. Pickup and drop-off columns on the order (shop, landmark, optional coordinates, optional photo). Weight class is `light` / `heavy` (ADR-008). |
| order_transitions | Append-only history — ADR-004 |
| dispatch_offers | Offer lifecycle ADR-007. Created in Phase 5. |
| price snapshot storage | Immutable components on `price_snapshots`, one snapshot per order |

## Tracking

| Concept | Notes |
|---|---|
| driver_location_samples | High-volume. Deleted 24 hours after receivedAt (ADR-011). |
| driver_presence / heartbeats | Optional; TBD ADR-011 |

## Ratings

| Concept | Notes |
|---|---|
| ratings | One row per order. Eligible only at `COMPLETED` (ADR-012) |
| complaints | No severity. Status `open`, `investigated`, or `dismissed` |
| rating_alerts | Not created. Threshold is still open |

## Finance

| Concept | Notes |
|---|---|
| driver_accounts | Not a separate table. One ledger stream per driver user (ADR-013 Option B) |
| ledger_entries | Append-only. Delivery kinds are unique per order |
| trip bonus | `driver_profiles.tripBonusAmount`, default 0 |
| capacity note | `driver_profiles.capacityNote`, free text for ops. Not a kilogram limit |
| driver_adjustments | Stored as ledger kinds `penalty` and `adjustment` |
| settlement_periods | No payout periods. Reports use Damascus day, Monday week, month, and year |

## Notifications / media / audit

| Concept | Notes |
|---|---|
| notification_events | What should be sent |
| notification_deliveries | Provider attempt results |
| media_objects | Metadata in DB; bytes in object storage |
| audit_logs | Privileged/high-risk actions |
| idempotency_records | Actor + method + path + key, 24h replay — ADR-017 |

## Data integrity (conceptual)

- Foreign keys.
- Unique order number.
- One active driver assignment per order.
- One rating per order under default policy.
- Immutable ledger entries (no silent updates).
- Soft-delete only where business rules require it.
- Composite indexes for operational queries (exact indexes TBD with query patterns).

## Important index intents (logical)

| Area | Intent |
|---|---|
| Orders by customer + createdAt | Customer history |
| Orders by status + updatedAt | Ops queues |
| Offers by driver + status + expiresAt | Driver offer inbox |
| Location samples by driver + capturedAt | Tracking queries |
| Ledger by account + createdAt | Statements |
| Audit by actor + createdAt | Security review |

## Related documents

- [`DOMAIN_MODEL.md`](DOMAIN_MODEL.md)
- [`ADR_INDEX.md`](ADR_INDEX.md)
- [`FINANCE.md`](FINANCE.md)
- [`ORDER_LIFECYCLE.md`](ORDER_LIFECYCLE.md)
