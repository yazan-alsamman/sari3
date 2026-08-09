# ADR-003: Authorization & Resource Scoping

## Status

PROPOSED

## Context

Every protected command needs server-side authorization and resource ownership checks to prevent IDOR and privilege escalation across customer, driver, and admin actors.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- IDOR prevention
- Least privilege
- Auditable admin actions
- Separation of AuthN vs AuthZ vs scope

## Considered Options

### Option A

Role + permission RBAC matrix

### Option B

RBAC + policy attributes (ABAC hybrid)

### Option C

Hard-coded role checks per use case


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
- ADR-002

## Open Questions

- Final permission catalog?
- Admin identity model?
- Ownership rules per resource?
- Cross-role support (user with multiple profiles)?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
