# ADR-002: Authentication & Session Strategy

## Status

PROPOSED

## Context

Customers, drivers, and admins must authenticate securely. Password hashing, token types, session/device management, and verification channel must be frozen before identity implementation.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Account takeover resistance
- Mobile refresh UX
- Revocation capability
- Alignment with NFR Argon2id intent

## Considered Options

### Option A

JWT access + opaque rotating refresh tokens

### Option B

Fully opaque server sessions

### Option C

Third-party identity provider


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

## Open Questions

- Verification channel (phone OTP, email, both)?
- Access/refresh TTLs?
- Device session limits?
- Admin auth same mechanism or separate?
- Password policy?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
