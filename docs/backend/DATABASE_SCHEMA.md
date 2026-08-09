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
| orders | Aggregate root |
| order_stops or pickup/drop-off structures | Modeling TBD |
| order_items / package_details | Taxonomy TBD ADR-008 |
| dispatch_offers | Offer lifecycle TBD ADR-007 |
| order_status_history | Required for auditability |
| price snapshot storage | Immutable components on order |

## Tracking

| Concept | Notes |
|---|---|
| driver_location_samples | High-volume; retention TBD ADR-011 |
| driver_presence / heartbeats | Optional; TBD ADR-011 |

## Ratings

| Concept | Notes |
|---|---|
| ratings | Default uniqueness: one per completed/eligible order |
| complaints | Severity TBD ADR-012 |
| rating_alerts | Threshold evaluation TBD ADR-012 |

## Finance

| Concept | Notes |
|---|---|
| driver_accounts | Account per driver (cardinality TBD) |
| ledger_entries | Append-only |
| incentive_rules | Configuration |
| driver_adjustments | Prefer modeling as ledger entries — TBD ADR-013 |
| settlement_periods | Cadence TBD ADR-013 |

## Notifications / media / audit

| Concept | Notes |
|---|---|
| notification_events | What should be sent |
| notification_deliveries | Provider attempt results |
| media_objects | Metadata in DB; bytes in object storage |
| audit_logs | Privileged/high-risk actions |
| idempotency_records | TBD ADR-017 |

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
