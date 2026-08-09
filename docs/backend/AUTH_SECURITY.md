# Authentication, Authorization & Security

## Purpose

Separates authentication, authorization, and resource scoping for Saree'e APIs and clients.

## Status

Directional specification. Token TTLs, RBAC matrix, and verification channel remain open.

Related ADRs:

- [`adrs/ADR-002-authentication-session.md`](adrs/ADR-002-authentication-session.md)
- [`adrs/ADR-003-authorization-resource-scoping.md`](adrs/ADR-003-authorization-resource-scoping.md)

## Authentication

Concerns:

| Topic | Status |
|---|---|
| Identity model | Customer / Driver / Admin linkage **TBD — ADR-002** |
| Registration and verification | Channel and flow **TBD — ADR-002** |
| Password hashing | Argon2id (documented intent in NFR) |
| Access token | Short-lived JWT (TTL **TBD — ADR-002**) |
| Refresh token | Opaque, hashed at rest, rotation + reuse detection |
| Sessions / devices | Device/session revocation required; limits **TBD — ADR-002** |
| Revocation | Required; mechanism **TBD — ADR-002** |

Never rely on mobile UI restrictions for authentication or authorization.

## Authorization

Separate:

1. **Authentication** — who is the caller?
2. **Authorization** — what may they do?
3. **Scope** — which customer/driver/order/admin resources may they access?

### Placeholder permission matrix

Final decisions: **TBD — ADR-003**. Entries marked TBD must not be treated as approved.

| Capability | Customer | Driver | Admin |
|---|---|---|---|
| Register / login | TBD | TBD | TBD |
| Create order | TBD | NO | TBD |
| Cancel own order | TBD | NO | TBD |
| View own orders | TBD | NO | YES |
| View all orders | NO | NO | TBD |
| Accept / reject offer | NO | TBD | TBD |
| Update own availability | NO | TBD | TBD |
| Post own location | NO | TBD | TBD |
| Confirm pickup / delivery | NO | TBD | TBD |
| Submit rating | TBD | NO | TBD |
| View own earnings | NO | TBD | YES |
| View all drivers | NO | NO | TBD |
| Suspend driver | NO | NO | TBD |
| Configure pricing / zones | NO | NO | TBD |
| Create financial adjustment | NO | NO | TBD |
| View live tracking (ops) | NO | NO | TBD |
| Manage media attachments on own order | TBD | TBD | TBD |

## API protections

- DTO validation.
- Rate limiting (limits **TBD — ADR-002 / NFR**).
- Security headers.
- CORS policy.
- Request size limits.
- Correlation IDs.
- Audit logging.
- Sensitive-field redaction.

## IDOR prevention

Every resource query must enforce ownership/role scope at the repository/application level, not only from client-provided IDs.

## Related documents

- [`../shared/NFR.md`](../shared/NFR.md)
- [`SECURITY_THREAT_MODEL.md`](SECURITY_THREAT_MODEL.md)
- [`API_GUIDELINES.md`](API_GUIDELINES.md)
- [`ADMIN.md`](ADMIN.md)
