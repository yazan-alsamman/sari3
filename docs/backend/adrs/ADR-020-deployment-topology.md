# ADR-020: Deployment Topology

## Status

PROPOSED

## Context

API, workers, PostgreSQL, Redis, object storage, and realtime need an explicit environment and deployment topology before production hardening.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Independent scaling of workers
- Safe migrations
- Secrets management
- Rollback

## Considered Options

### Option A

Single node compose for staging + managed prod services

### Option B

Kubernetes from early stages

### Option C

PaaS-managed containers


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
- ADR-010
- ADR-015
- ADR-019

## Open Questions

- Environments?
- API vs worker process split?
- Backup/RPO/RTO?
- Migration strategy?
- Realtime scaling?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
