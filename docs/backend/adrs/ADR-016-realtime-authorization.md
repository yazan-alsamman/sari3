# ADR-016: Realtime Authorization

## Status

PROPOSED

## Context

Realtime channels can leak sensitive operational data if membership is not authorized equivalently to REST scopes.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Least privilege
- Prevent cross-customer/driver leakage
- Admin channel protection
- Reconnect safety

## Considered Options

### Option A

Token-gated rooms mapped to REST scopes

### Option B

Per-event authorization checks

### Option C

Server-side push only (no client-subscribe rooms)


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

- ADR-003
- ADR-010

## Open Questions

- Room naming and membership rules?
- Token refresh on sockets?
- Admin live channel scope?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
