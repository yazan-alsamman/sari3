# ADR-002: Authentication & Session Strategy

## Status

ACCEPTED

## Context

Customers, drivers, and admins must authenticate securely. Password hashing, token types, session/device management, and verification channel must be frozen before identity implementation.

## Decision

**Choose Option A:** JWT **access** tokens + **opaque rotating refresh** tokens stored server-side (revocable).

### Rules

| Topic | Decision |
|---|---|
| Password hashing | **Argon2id** |
| Access token | Short-lived JWT (recommended default **15 minutes**) |
| Refresh token | Opaque, hashed at rest, **rotating** on use; revoke on logout/theft |
| Roles | `customer`, `driver`, `admin` (same user may later hold multiple profiles — v1: one primary role per account type registration) |
| Driver work gate | Registration creates account with `approvalStatus=pending`; cannot go online until admin approves (ADR-003) |
| Driver KYC (v1) | firstName, lastName, birthDate, ID photo (ADR-015), phone, password, vehicle, basket size, capacity |
| Customer auth (v1) | Register with profile; later login name/phone + password (exact identifier field frozen at API design) |
| Admin | Same token mechanism + elevated role; MFA **recommended for launch+1**, not blocking Phase 2 if ops accepts risk |
| Verification channel | **Phone OTP** as primary verification path for production Syria market (provider TBD in ADR-014); email optional later |

### Password policy (v1)

- Minimum 8 characters
- Block common passwords list
- No plaintext storage ever

## Decision Drivers

- Account takeover resistance
- Mobile refresh UX
- Revocation capability
- Alignment with NFR Argon2id intent

## Considered Options

### Option A — JWT access + opaque rotating refresh ? **SELECTED**

### Option B — Fully opaque server sessions

Heavier for mobile multi-device.

### Option C — Third-party IdP

Slower to market; optional later.

## Consequences

- Refresh theft mitigated by rotation + reuse detection
- Access JWT must not carry sensitive PII beyond sub/role

## Security Implications

- HTTPS only
- Refresh cookies/storage guidance for mobile vs web documented in AUTH_SECURITY
- Admin credential rotation runbook required

## Operational Implications

- Redis or DB table for refresh sessions
- Metrics on auth failures / lockouts

## Data Implications

- `users`, `sessions/refresh_tokens`, role bindings
- Driver KYC media references via ADR-015

## API Implications

- `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- Driver join remains pending until admin approve endpoint

## Mobile Implications

- Secure storage for refresh token
- Silent refresh before access expiry

## Dependencies

- ADR-001
- ADR-015 (ID photo upload)

## Open Questions

- Exact access/refresh TTLs final numbers (defaults above until owner tunes)
- Device session max count (recommend **5** devices — confirm at acceptance)
- OTP SMS provider choice (ADR-014)

## Approval

- Decision owner: Product Owner
- Approved by: Yazan (CTO) — accepted backend work order
- Date: 2026-09-22
