# ADR-007: Dispatch Candidate Selection

## Status

ACCEPTED

## Context

The backend must select, rank, offer, and reassign drivers using eligibility and configurable policy without race conditions on acceptance.

## Decision

**Choose Option B:** Multi-offer **parallel** dispatch to eligible drivers; **first accept wins**; competing offers cancelled atomically.

### Eligibility (all must pass)

- `approvalStatus = approved`
- Availability online / accepting work
- Location freshness OK (ADR-011 thresholds)
- Capacity / basket match (ADR-008)
- Zone eligibility (ADR-005)
- Not exceeding max active orders / multi-order gate (ADR-009)
- Not filtered by a driver “VIP-only” preference (**removed** — VIP is order mode only)

### Ranking (v1 heuristic)

1. VIP orders prioritized in the offer queue  
2. Fresher location  
3. Closer to pickup (haversine / provider distance)  
4. Lower current workload  

Exact weights admin-tunable later; v1 ships with documented defaults in code config.

### Offer policy

| Parameter | v1 value |
|---|---|
| Offer timeout | **15 seconds** |
| On reject/timeout | Re-offer to next eligible set / continue parallel pool |
| Concurrent accept | DB transaction + row lock / unique assignment; losers get `offer_taken` |
| Max parallel offers | Configurable (recommend start **5**) |

## Decision Drivers

- Fairness
- VIP priority
- Capacity and freshness safety
- Concurrency safety
- Auditability

## Considered Options

### Option A — Single-offer sequential

Slower fill time.

### Option B — Multi-offer parallel, first-accept wins ? **SELECTED**

### Option C — Batch auction window

Unnecessary complexity for v1.

## Consequences

- Need strong idempotency on accept (ADR-017)
- Offer entities with expiry job (BullMQ)

## Security Implications

- Drivers only see offers addressed to them
- Accept validates offer token/id ownership

## Operational Implications

- Metrics: offer accept rate, time-to-assign, expire rate

## Data Implications

- `dispatch_offers` table with status offered/accepted/expired/cancelled

## API Implications

- Driver offer stream (realtime ADR-010) + REST fallback poll

## Mobile Implications

- 15s countdown UX retained

## Dependencies

- ADR-004
- ADR-005
- ADR-008
- ADR-011 (freshness numbers in wave-2 freeze; temporary conservative defaults allowed only after ADR-011 accepted)

## Open Questions

- Final ranking weights
- ADR-011 freshness seconds (block production dispatch tuning until accepted)

## Approval

- Decision owner: Product Owner
- Approved by: Yazan (CTO) — accepted backend work order
- Date: 2026-09-22
