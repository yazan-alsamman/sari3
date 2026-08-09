# Security Threat Model

## Purpose

Maps primary threats to required mitigation categories and owning ADRs.

## Primary threats

| Threat | Mitigation direction | Owning ADR / doc |
|---|---|---|
| Account takeover | Strong auth/session controls, rotation, revocation | ADR-002 |
| Fake orders | AuthZ, validation, idempotency, rate limits | ADR-003, ADR-017 |
| Driver impersonation | AuthN/AuthZ, session binding | ADR-002, ADR-003 |
| IDOR / resource enumeration | Server-side ownership/scope checks | ADR-003 |
| Manipulated prices | Server-side pricing + snapshots | ADR-006 |
| Duplicate order creation | Idempotency keys | ADR-017 |
| Double assignment | Transactional offer accept | ADR-007 |
| Forged location updates | Session binding + freshness + anomaly controls | ADR-011 |
| Rating abuse | Eligibility, uniqueness, abuse detection | ADR-012 |
| Financial manipulation | Append-only ledger + audited adjustments | ADR-013 |
| Malicious file uploads | MIME/size validation, signed URLs, scanning TBD | ADR-015 |
| Notification abuse | Rate limits, provider controls | ADR-014 |
| Privilege escalation | RBAC/permission matrix | ADR-003 |
| API abuse | Rate limiting, auth, payload limits | ADR-002, NFR |

Exact control parameters remain **TBD** in the referenced ADRs. Do not treat this table as an approved control baseline.

## Security review gate

Every new endpoint must document:

- Actor.
- Permission.
- Resource scope.
- Sensitive data.
- Abuse/rate-limit considerations.
- Audit requirements.

## Related documents

- [`AUTH_SECURITY.md`](AUTH_SECURITY.md)
- [`../shared/NFR.md`](../shared/NFR.md)
- [`ADR_INDEX.md`](ADR_INDEX.md)
