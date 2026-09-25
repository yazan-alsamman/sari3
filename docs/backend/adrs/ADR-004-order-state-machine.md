# ADR-004: Order State Machine

## Status

ACCEPTED

## Context

Order lifecycle is the core domain workflow. States, actors, legal transitions, cancellation, expiration, failure, reassignment, and rating/completion semantics must be explicit before orders are implemented.

## Decision

### Rating vs completion — **Option B (SELECTED)**

Align with product requirements: rating happens **after** successful completion.

```text
… -> DELIVERED -> COMPLETED -> (rating eligible; not a blocking state)
```

`RATING_PENDING` is **not** a required order state for v1.

### Happy-path states (v1)

```text
DRAFT
  -> PRICE_CONFIRMED
  -> SEARCHING_DRIVER
  -> DRIVER_OFFERED
  -> DRIVER_ACCEPTED
  -> DRIVER_TO_PICKUP
  -> PICKED_UP
  -> IN_TRANSIT
  -> DELIVERED
  -> COMPLETED
```

### Exceptional states (v1)

- `CANCELLED` — cancelled before COMPLETED
- `EXPIRED` — search/offer policy timeout exhausted
- `FAILED` — operational failure (admin/system)
- `UNFULFILLED` — could not be fulfilled after retries (order-level; **not** the same as driver offer reject)

### Transition rules (summary)

- Server-authoritative; illegal transitions ? 409/422
- Every transition records: actor, timestamp, source, optional reason
- Driver offer reject/expire does **not** set order to UNFULFILLED immediately; returns to SEARCHING_DRIVER / DRIVER_OFFERED per ADR-007
- `COMPLETED` requires delivery confirmation checkpoint (driver confirms cash/delivery; proof photo optional in v1 — ADR-015)
- Customer cancel allowed in early states only (DRAFT…DRIVER_TO_PICKUP); fees **TBD commercial sheet** (default v1: no fee until sheet signed)
- Admin override allowed with audit (ADR-003)

### Multi-order note

A driver may hold a second assigned order while finishing the first (ADR-009). Each order keeps its own state machine independently.

## Decision Drivers

- Server-authoritative state
- Auditability
- Prevent illegal transitions
- Align mobile UX and API with PRD rating-after-completion

## Considered Options

### Option A — RATING_PENDING before COMPLETED

Rejected; conflicts with PRD/mobile intent.

### Option B — DELIVERED ? COMPLETED then rating eligible ? **SELECTED**

### Option C — Reduced state set

Rejected; loses operational clarity for dispatch/tracking.

## Consequences

- Ratings module keys off COMPLETED
- ORDER_LIFECYCLE.md must be updated to remove contradiction once this ADR is ACCEPTED

## Security Implications

- Drivers cannot jump to COMPLETED without allowed prior state
- Admin overrides audited

## Operational Implications

- Clear ops dashboard states
- Reassignment does not invent silent state skips

## Data Implications

- `order_transitions` append-only history table

## API Implications

- Explicit transition endpoints or command endpoints mapped 1:1 to allowed actions

## Mobile Implications

- Customer tracking maps statuses to Arabic labels
- Second customer may see DRIVER_ACCEPTED / DRIVER_TO_PICKUP as “?????? ?? ????? ????”

## Dependencies

- ADR-001
- ADR-003

## Open Questions

- Exact cancel fee schedule (commercial) — not inventing amounts
- Whether pickup photo proof becomes mandatory post-v1

## Approval

- Decision owner: Product Owner
- Approved by: Yazan (CTO) — accepted backend work order
- Date: 2026-09-22
