# ADR-017: Idempotency Strategy

## Status

PROPOSED

## Context

Mobile networks retry. Order creation, accept/reject, financial adjustments, and similar commands need safe idempotency.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Exactly-once business effect for critical commands
- Client simplicity
- Replay safety

## Considered Options

### Option A

Client idempotency keys stored server-side

### Option B

Natural idempotency via offer/order constraints only

### Option C

Outbox + dedupe hybrid


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
- ADR-007
- ADR-013

## Open Questions

- Which endpoints require keys?
- Key TTL?
- Response caching semantics?
- Scope of uniqueness (actor vs global)?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
