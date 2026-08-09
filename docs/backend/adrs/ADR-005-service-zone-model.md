# ADR-005: Service Zone Model

## Status

PROPOSED

## Context

Pricing, dispatch eligibility, and operational coverage depend on how service zones are defined, assigned to drivers, and matched to pickup/drop-off points.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Zone-to-zone pricing
- Dispatch eligibility
- Operational coverage control
- Admin configurability

## Considered Options

### Option A

Polygon geofences

### Option B

Named areas with manual assignment

### Option C

Hybrid geofence + admin area labels


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

- ADR-001
- ADR-004

## Open Questions

- Zone geometry model?
- How addresses map to zones without exclusive map-search dependency?
- Driver multi-zone assignment?
- Out-of-zone order behavior?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
