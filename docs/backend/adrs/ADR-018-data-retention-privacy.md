# ADR-018: Data Retention & Privacy

## Status

PROPOSED

## Context

Location history and personal data require minimization, retention, and deletion/anonymization policies for privacy and compliance readiness.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Privacy minimization
- Storage cost
- Legal/compliance readiness
- Operational debugging needs

## Considered Options

### Option A

Short rolling location retention + aggregated metrics

### Option B

Tiered hot/warm/cold retention

### Option C

Immediate anonymization after delivery completion


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

- ADR-011
- ADR-013
- ADR-015

## Open Questions

- Retention per data class?
- Account deletion policy?
- Admin access to historical PII?
- Anonymization vs deletion?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
