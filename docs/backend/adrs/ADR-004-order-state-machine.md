# ADR-004: Order State Machine

## Status

PROPOSED

## Context

Order lifecycle is the core domain workflow. States, actors, legal transitions, cancellation, expiration, failure, reassignment, and rating/completion semantics must be explicit before orders are implemented.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Server-authoritative state
- Auditability
- Prevent illegal transitions
- Align mobile UX and API

## Considered Options

### Option A

Proposed state list with RATING_PENDING before COMPLETED

### Option B

DELIVERED then COMPLETED then rating eligible

### Option C

Reduced state set collapsing some intermediate states


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
- ADR-003

## Open Questions

- Resolve rating vs completion contradiction
- Final state list
- Cancel windows by actor/state
- Expiration rules
- Pickup/delivery proof requirements
- Admin override catalog
- REJECTED vs offer rejection naming

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
