# ADR-017: Idempotency Strategy

## Status

ACCEPTED

## Context

Mobile networks retry. Order creation, offer accept/reject, rating submit, and financial adjustments must have exactly one business effect when the client repeats the same command.

## Decision

**Choose Option A:** the client sends an idempotency key. The server stores it and replays the original result.

### Rule

1. Critical `POST` commands require header `Idempotency-Key` (opaque string, 8–128 characters).
2. The server stores one record per **actor user + method + path + key**.
3. The same key and the same request body return the stored status code and response body. No second business effect.
4. The same key with a different request body returns `409` and code `IDEMPOTENCY_CONFLICT`.
5. A missing key on a required command returns `400` and code `VALIDATION_ERROR`.
6. Records expire after **24 hours**. After expiry the key may be reused as a new command.
7. Uniqueness is per actor, not global. Two users may use the same key string.

### Commands that require a key (v1)

- Create / submit order
- Driver accept offer
- Driver reject offer
- Submit rating (when that command exists)
- Financial adjustment commands (when that command exists)

Price preview is not idempotent. It is a read-style calculation.

### Storage

Table `idempotency_records`: actor user id, method, path, key, request hash, response status, response body, created at, expires at.

## Decision Drivers

- Exactly-once business effect for critical commands
- Client simplicity
- Replay safety
- Match [`API_GUIDELINES.md`](../API_GUIDELINES.md) and the mobile order flow, which already submit an idempotency key

## Considered Options

### Option A — Client idempotency keys stored server-side → **SELECTED**

Safe when the first response is lost and the client retries.

### Option B — Natural idempotency via offer/order constraints only

Rejected for create-order. A double tap can insert two orders before a unique business constraint exists.

### Option C — Outbox + dedupe hybrid

Heavier than v1 needs. Worker outbox can be added later without replacing client keys.

## Consequences

- Order, dispatch, rating, and finance command handlers must consult the idempotency store inside the same transaction as the business write.
- Clients generate one key per user action and reuse it on retry.

## Security Implications

- Keys are scoped to the authenticated actor. A key does not grant access to another user's result.
- Stored response bodies must not include secrets beyond the normal command response.

## Operational Implications

- Expired rows may be deleted by a cleanup job after 24 hours.
- Replay does not write a second audit event for the business action.

## Data Implications

- `idempotency_records` as specified above.

## API Implications

- Required header `Idempotency-Key` on the v1 command list.
- Error codes: `VALIDATION_ERROR`, `IDEMPOTENCY_CONFLICT`.

## Mobile Implications

- Generate the key when the user confirms the action. Send the same key if the request is retried.

## Dependencies

- ADR-001
- ADR-004
- ADR-007
- ADR-013

## Open Questions

- None for v1. Coupon or payment-provider callbacks stay out of scope until those commands exist.

## Approval

- Decision owner: Product Owner
- Approved by: Product Owner — accepted ADR-017 and delegated the option choice (Option A)
- Date: 2026-10-07
