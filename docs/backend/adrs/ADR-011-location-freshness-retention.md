# ADR-011: Location Freshness & Retention

## Status

PROPOSED

## Context

Dispatch and customer trust depend on freshness classification. Privacy requires retention limits. Thresholds must be explicit and measurable.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Dispatch safety
- Privacy minimization
- Stale-location honesty in UX
- Storage cost

## Considered Options

### Option A

Time-based freshness tiers

### Option B

Time + accuracy hybrid tiers

### Option C

Presence heartbeat separate from GPS samples


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

- ADR-010

## Open Questions

- Fresh/Aging/Stale thresholds?
- Sampling interval/distance?
- Accuracy gate?
- Retention period?
- Customer visibility coarseness?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
