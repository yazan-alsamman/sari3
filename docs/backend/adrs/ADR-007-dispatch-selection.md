# ADR-007: Dispatch Candidate Selection

## Status

PROPOSED

## Context

The backend must select, rank, offer, and reassign drivers using eligibility and configurable policy without race conditions on acceptance.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Fairness
- VIP priority
- Capacity and freshness safety
- Concurrency safety
- Auditability

## Considered Options

### Option A

Single-offer sequential dispatch

### Option B

Multi-offer parallel dispatch with first-accept wins

### Option C

Batch auction window


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

- ADR-004
- ADR-005
- ADR-008
- ADR-011

## Open Questions

- Offer timeout?
- Ranking weights?
- Reject/expire retry policy?
- Concurrent accept locking?
- Fairness definition?
- VIP prioritization rules?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
