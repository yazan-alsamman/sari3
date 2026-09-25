# ADR-003: Authorization & Resource Scoping

## Status

ACCEPTED

## Context

Every protected command needs server-side authorization and resource ownership checks to prevent IDOR and privilege escalation across customer, driver, and admin actors.

## Decision

**Choose Option B:** RBAC + lightweight policy attributes (hybrid).

### Roles (v1)

- `customer`
- `driver`
- `admin`

### Core rules

| Resource | Customer | Driver | Admin |
|---|---|---|---|
| Own profile | R/W | R/W | R/W |
| Own orders | R/W (create/cancel per lifecycle) | — | R/W + override |
| Assigned order | R (limited fields) | R/W (allowed transitions only) | R/W |
| Other users' PII | Deny | Deny | Allow (audited) |
| Pricing config | Deny | Deny | Allow |
| Driver approval | Deny | Deny | Allow |
| Finance reports | Deny | Own earnings R | Full |

### Attributes used in policies

- `approvalStatus` for drivers (`pending` cannot accept offers / go online)
- Order ownership / assignment
- Basket eligibility enforced in dispatch domain (not only UI)

### Audit

All admin overrides and approval decisions write an audit event (actor, target, before/after, reason).

## Decision Drivers

- IDOR prevention
- Least privilege
- Auditable admin actions
- Separation of AuthN vs AuthZ vs scope

## Considered Options

### Option A — Role + permission RBAC matrix only

### Option B — RBAC + policy attributes ? **SELECTED**

### Option C — Hard-coded role checks per use case

Rejected for maintainability.

## Consequences

- Every use case declares required permission + resource scope check
- Controllers never trust client-supplied owner IDs without scope verification

## Security Implications

- Central guards + policy helpers
- Deny by default

## Operational Implications

- Admin actions appear in audit log for support/compliance

## Data Implications

- Permission catalog table or code-defined enum with migrations for changes

## API Implications

- 401 unauthenticated / 403 unauthorized consistently

## Mobile Implications

- UI may hide actions; server remains authoritative

## Dependencies

- ADR-001
- ADR-002

## Open Questions

- Full permission enum list finalized during Phase 2 API catalog pass
- Multi-profile single login deferred post-v1

## Approval

- Decision owner: Product Owner
- Approved by: Yazan (CTO) — accepted backend work order
- Date: 2026-09-22
