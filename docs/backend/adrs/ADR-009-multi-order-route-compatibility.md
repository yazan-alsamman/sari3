# ADR-009: Multi-Order Route Compatibility

## Status

PROPOSED

## Context

Drivers may carry multiple compatible orders. Insertion constraints, VIP behavior, provider usage, and failure modes must be decided before production routing.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- SLA quality
- Capacity safety
- Deterministic initial heuristic
- Provider independence for business decisions

## Considered Options

### Option A

Deterministic insertion heuristic only

### Option B

Heuristic + external optimizer later behind port

### Option C

External optimizer required from day one


## Consequences

TBD

## Security Implications

TBD

## Operational Implications

TBD

## Data Implications

TBD

## API Implications

TBD

## Mobile Implications

TBD

## Dependencies

- ADR-007
- ADR-008

## Open Questions

- Max active orders?
- Max deviation/ETA degradation?
- Pickup/drop-off ordering?
- VIP mid-route behavior?
- Provider choice and outage behavior?
- Route recalculation triggers?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
