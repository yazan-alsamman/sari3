# Background Jobs

Use BullMQ or equivalent for asynchronous work.

## Jobs

- Notification delivery/retry.
- Dispatch offer expiration.
- Tracking cleanup.
- Rating alert evaluation.
- Daily/weekly/monthly financial aggregation.
- Orphan media cleanup.
- Stale driver detection.

Each job must define:

- Payload contract.
- Retry policy.
- Backoff.
- Idempotency strategy.
- Failure/dead-letter behavior.
## Related documents

- [`DISPATCH.md`](DISPATCH.md)
- [`NOTIFICATIONS.md`](NOTIFICATIONS.md)
- [`FINANCE.md`](FINANCE.md)
- [`adrs/ADR-017-idempotency.md`](adrs/ADR-017-idempotency.md)
