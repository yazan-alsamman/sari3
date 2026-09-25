# ADR-009: Multi-Order Route Compatibility

## Status

ACCEPTED

## Context

Drivers may carry multiple compatible orders. Insertion constraints, VIP behavior, provider usage, and failure modes must be decided before production routing.

## Decision

**Choose Option A for v1:** Deterministic insertion heuristic only (external optimizer behind a port later).

### Owner-confirmed rules (v1)

| Rule | Value |
|---|---|
| Max active orders per driver | **2** |
| When second offer may be presented | (1) **= 5 minutes** remaining to first delivery ETA **or** (2) after first order reaches `COMPLETED`/`DELIVERED` handoff into next |
| Capacity | Still must pass ADR-008 basket/weight gate |
| Customer UX for queued second order | Status shows driver is on the way (`DRIVER_ACCEPTED` / `DRIVER_TO_PICKUP`) |

### Heuristic (v1)

- Prefer second pickup after first delivery completes when possible
- If accepting while finishing first: queue as next; do not divert mid-delivery unless ETA gate says finishing imminently (=5 min)
- VIP second orders allowed if capacity allows; do not steal from an in-progress non-VIP delivery except via the =5 min gate
- Route provider optional; if unavailable, use zone centroids / haversine

### Failure modes

- If second order becomes incompatible ? cancel assignment with customer re-search (audited)
- Provider outage ? heuristic-only mode

## Decision Drivers

- SLA quality
- Capacity safety
- Deterministic initial heuristic
- Provider independence for business decisions
- Match confirmed product behavior

## Considered Options

### Option A — Deterministic insertion heuristic only ? **SELECTED (v1)**

### Option B — Heuristic + external optimizer later behind port

Planned evolution path.

### Option C — External optimizer required from day one

Rejected for launch risk/cost.

## Consequences

- Tracking must support driver with active + queued order
- Finance posts per completed order independently

## Security Implications

- Driver cannot accept third order (hard cap 2)

## Operational Implications

- Ops can see primary + queued on live map

## Data Implications

- Assignment table supports `sequence` / `queued` flag

## API Implications

- Accept-offer while busy allowed only if gate passes

## Mobile Implications

- Driver UI: queue banner + second offer sheet near delivery

## Dependencies

- ADR-007
- ADR-008

## Open Questions

- Exact ETA source for “=5 minutes” (maps provider vs stage heuristic) — implement behind port; provider chosen with ADR-010/maps decision
- Max route deviation km (defer numeric until ops sheet; v1 uses time gate primarily)

## Approval

- Decision owner: Product Owner
- Approved by: Yazan (CTO) — accepted backend work order
- Date: 2026-09-22
