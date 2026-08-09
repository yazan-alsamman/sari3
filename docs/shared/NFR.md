# Non-Functional Requirements

## Purpose

Cross-cutting non-functional requirements for Saree'e.

## Security

- Passwords hashed with Argon2id.
- Short-lived access tokens and rotating opaque refresh tokens.
- Rate limiting on authentication and sensitive commands (limits **TBD — ADR-002**).
- Server-side authorization on every protected command.
- Audit logs for privileged actions.
- No secrets committed to source control.

## Reliability

- Idempotency for order creation/payment-like financial commands and retryable callbacks (**TBD — ADR-017**).
- Transactional state changes.
- Background jobs for notifications and asynchronous processing.
- Explicit retry and dead-letter strategy.

## Performance targets

Initial targets (to be validated by load testing):

- Standard API p95 < 500 ms excluding third-party providers.
- Dispatch decision p95 < 1 s under normal load.
- Live location ingestion must be throttled and deduplicated.
- Admin active-order views must support pagination/filtering.

## Availability

- Health endpoint.
- Readiness endpoint.
- Graceful shutdown.
- Database/queue connectivity checks.
- Availability percentage target: **TBD — ADR-020**.

## Observability

- Structured JSON logs.
- Correlation/request ID.
- Metrics for orders, dispatch, notifications, tracking, API latency, errors, queue lag.
- Audit events for security and operational actions.
- Tooling choices: **TBD — ADR-019**.

## Privacy

- Minimize stored location history.
- Define retention for tracking points (**TBD — ADR-011 / ADR-018**).
- Restrict customer/driver personal data by role.
- Account deletion / data handling policy: **TBD — ADR-018**.

## Disaster recovery

- Backup strategy: **TBD — ADR-020**
- RPO / RTO: **TBD — ADR-020**

## Related documents

- [`../backend/OBSERVABILITY.md`](../backend/OBSERVABILITY.md)
- [`../backend/SECURITY_THREAT_MODEL.md`](../backend/SECURITY_THREAT_MODEL.md)
- [`../backend/ADR_INDEX.md`](../backend/ADR_INDEX.md)
