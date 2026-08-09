# ADR-008: Driver Capacity Model

## Status

PROPOSED

## Context

Automotive parts may be large/heavy. Capacity must constrain dispatch and multi-order routing. Numeric limits are business decisions and must not be invented by engineering.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Safety
- Motorcycle constraints
- Multi-order compatibility
- Admin configurability

## Considered Options

### Option A

Global default capacity profile + driver overrides

### Option B

Per-vehicle-class profiles only

### Option C

Order-class hard bans without numeric capacity


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
- ADR-006

## Open Questions

- Max weight?
- Max volume?
- Max packages?
- Package categories?
- Oversized/special handling rules?
- Who can edit capacity?
- Exceeded-capacity rejection semantics?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
