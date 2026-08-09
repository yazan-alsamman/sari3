# ADR-010: Live Tracking Transport

## Status

PROPOSED

## Context

Clients need timely operational updates, but transport must not become source of truth. Transport technology and event catalog must be chosen explicitly.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Mobile battery/network realities
- Admin live ops
- Authority of REST/domain state
- Operational complexity

## Considered Options

### Option A

Socket.IO

### Option B

Raw WebSockets

### Option C

SSE for some channels + REST polling fallback


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

- Chosen transport?
- Event catalog?
- Fallback polling policy?
- Scaling model?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
