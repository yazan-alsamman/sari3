# ADR-013: Financial Ledger Model

## Status

PROPOSED

## Context

Driver earnings, platform share, incentives, penalties, and settlements are high-risk. Ledger must be append-only and reproducible for reporting.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Financial integrity
- Auditability
- Reproducible reports
- Authorization of adjustments

## Considered Options

### Option A

Double-entry style ledger

### Option B

Single-account append-only movements with entry kinds

### Option C

External accounting system as system of record


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

- ADR-006
- ADR-004
- ADR-012

## Open Questions

- Driver earning formula?
- Platform share formula?
- Posting trigger state?
- Settlement cadence?
- Currency/rounding?
- Adjustment permissions?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
